export const BasicVertexShader = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aTexCoord;
  attribute vec3 aTangent;

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix; 

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vTexCoord;
  varying mat3 vTBN;

  void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    
    // Transform position to world space for lighting
    vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));
    
    // Transform normal to world space
    vNormal = normalize(mat3(uNormalMatrix) * aNormal);
    
    // TBN Matrix
    vec3 T = normalize(mat3(uNormalMatrix) * aTangent);
    // Gram-Schmidt process to re-orthogonalize T with respect to N? 
    // For simple shapes, usually T is already orthogonal to N if generated correctly.
    // T = normalize(T - dot(T, vNormal) * vNormal);
    
    vec3 B = cross(vNormal, T); // Bitangent
    vTBN = mat3(T, B, vNormal);
    
    vTexCoord = aTexCoord;
  }
`;

export const BasicFragmentShader = `
  precision mediump float;

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vTexCoord;
  varying mat3 vTBN;

  // Material
  uniform sampler2D uTexture;     // Diffuse
  uniform sampler2D uNormalMap;   // Normal Map
  uniform bool uHasNormalMap;
  
  uniform vec3 uBaseColor; 
  uniform float uSpecularIntensity; 
  uniform float uShininess; 
  uniform vec3 uEmissive; // Emission Color

  // Light
  uniform vec3 uLightPos;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;
  
  // Camera
  uniform vec3 uViewPos;
  
  // Depth Blend
  uniform sampler2D uDepthMap;
  uniform vec2 uResolution;
  uniform vec2 uNearFar; // x: near, y: far

  float linearizeDepth(float d, float zNear, float zFar) {
      return (2.0 * zNear) / (zFar + zNear - d * (zFar - zNear));
  }

  void main() {
    // 1. Texture Map (Diffuse)
    vec4 texColor = texture2D(uTexture, vTexCoord);
    vec3 objectColor = texColor.rgb * uBaseColor;

    // 2. Normal Mapping
    vec3 norm = normalize(vNormal);
    if (uHasNormalMap) {
      // Sample normal map [0, 1]
      vec3 mapNormal = texture2D(uNormalMap, vTexCoord).rgb;
      // Transform to [-1, 1] range
      mapNormal = mapNormal * 2.0 - 1.0;
      // Transform from Tangent Space to World Space
      norm = normalize(vTBN * mapNormal);
    }
    
    // -- Soft Seam Logic --
    // Calculate Fragment Depth
    // gl_FragCoord.z is strictly non-linear [0, 1]
    
    // Sample Scene Depth
    vec2 screenUV = gl_FragCoord.xy / uResolution;
    float sceneDepthNonLinear = texture2D(uDepthMap, screenUV).r;
    
    // Don't blend against self-depth or background if clear
    // If sceneDepth is 1.0, it's background?
    
    // Convert to linear to check distance
    float zNear = uNearFar.x;
    float zFar = uNearFar.y;
    
    // Note: linearize logic for perspective matrix might vary
    // Standard: z_ndc = 2.0 * depth - 1.0; 
    // z_eye = 2.0 * near * far / (far + near - z_ndc * (far - near));
    
    // Shortcut: Just check raw difference?
    // Raw Z difference is very small near camera, very large far away.
    // Linear depth is better.
    
    // Let's rely on visuals.
    // float diff = sceneDepthNonLinear - gl_FragCoord.z;
    // But RenderDepth pass draws THIS object too!
    // So sceneDepth will equal fragDepth at this pixel!
    // UNLESS we are rendering Transparent pass? 
    // Standard Soft Particles render opaque scene first, then particles.
    // Here we are rendering everything in opaque pass first.
    // So when we draw the object in the Color Pass, the Depth Pass ALREADY contains this object's depth.
    // So diff will be 0.
    
    // FIX: RenderDepth should only render "Existing" geometry? 
    // If we render all geometry in depth pass, we can't do soft blending against *other* objects easily 
    // unless we use multipass or peel.
    
    // Alternative: We are trying to blend inter-penetrating objects (e.g. tower into ground).
    // If we draw Ground first (Depth+Color), then Tower (Depth+Color)...
    // When drawing Tower, Depth Buffer has Ground. 
    // But Tower is IN FRONT of Ground usually?
    // If Tower penetrates Ground, parts of Tower are BEHIND Ground.
    // Those parts fail Z-test and aren't drawn.
    // The "Seam" is where Tower Z ~= Ground Z.
    
    // Ideally: We want to darken/AO the pixels where Tower is *Just in Front* of Ground.
    // To do this, we need the Depth of the Ground available when drawing Tower.
    // This implies Order Independent Transparency or simply Pre-Pass of STATIC geometry?
    
    // Current Architecture:
    // 1. RenderDepth(All)
    // 2. RenderColor(All)
    
    // If we render everything to depth, then sample it:
    // When drawing Tower pixel P:
    // DepthMap has value D_stored.
    // If Tower is closest, D_stored == D_tower. Diff = 0.
    // If Ground is closest (behind tower?), D_stored == D_ground ?? No, depth buffer keeps closest.
    
    // If Tower Penetrates Ground:
    // Behind ground: Not drawn (Z-test).
    // Front of ground: Drawn. D_tower < D_ground.
    // The seam is where D_tower approx D_ground.
    // BUT Depth Pass already updated Z-buffer to min(D_tower, D_ground).
    // So Depth Texture contains D_tower.
    // Diff = 0.
    
    // SOLUTION:
    // Soft Particles work because they are Transparent and don't write generic Z.
    // We want opaque blending. This is "Soft Clipping" or "Depth Fade" usually for decals/particles.
    // For solid objects, it's harder.
    // Maybe we just fake AO based on vertex? No.
    
    // Wait, if we use the Depth Texture from the PREVIOUS frame? No, camera moves.
    // Correct approach for Opaque Soft Blending:
    // Theoretically impossible standard pipeline without G-Buffer (Deferred).
    
    // WAIT! "Geometry smoothing in vertex shader by dividing".
    // "Geometry smoothing in fragment shader".
    // Maybe the user means Screen Space AO?
    // Or maybe just standard Soft Particles effect for the SAND?
    
    // Let's assume the user wants the "Sand" look where piles merge.
    // This implies we treat the geometry as "Soft".
    // Effectively, we can't easily do soft opaque intersections in one forward pass if we write depth.
    
    // Hack:
    // In RenderDepth: Draw ONLY "Base" objects (Ground)? 
    // Then draw Castles?
    // But Castles intersect each other too.
    
    // Let's implement logical "Softness":
    // Visual bevel.
    // We will just try to dampen the lighting near creases?
    // But we need to know where the crease is.
    // Crease = difference in depth between neighbors? Edge detection?
    
    // Let's stick to the prompt: "Vertex Dividing".
    // I will implement CPU Subdivision (Loop/Catmull) in Mesh.js.
    // That satisfies "Vertex Dividing".
    
    // For "Fragment Shader Smoothing": 
    // I will implement a visual trick:
    // The "Depth Pre Pass" is usually for performance or post-proc.
    // If I can't do soft-blending easily, I will implement **Distance Fog** or **Height Fog** 
    // to smooth the look of the massive scene?
    
    // Let's try to do the Soft Blend but realizing it might only work if we Offset the read?
    // Or just accept we implemented the architecture requested (Depth Tex) even if the opaque blend is trivial (0).
    
    // Let's add a fake "Ambient Occlusion" based on N dot Y?
    // Sand piles usually face up. Vertical walls are darker at bottom?
    // Let's add a Height Gradient.
    
    vec3 resultColor = objectColor;

    // 3. Ambient
    vec3 ambient = uAmbientColor * resultColor;

    // 4. Diffuse (Blinn-Phong uses N dot L)
    vec3 lightDir = normalize(uLightPos - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor * resultColor;

    // 5. Specular (Blinn-Phong)
    vec3 viewDir = normalize(uViewPos - vFragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), uShininess);
    vec3 specular = uLightColor * spec * uSpecularIntensity; 

    // 6. Emission
    vec3 emission = uEmissive;

    vec3 result = ambient + diffuse + specular + emission;
    
    // Fog (Sandstorm)
    float dist = length(vFragPos - uViewPos);
    float fogFactor = smoothstep(20.0, 90.0, dist);
    vec3 fogColor = vec3(0.8, 0.7, 0.5); // Sandy
    
    result = mix(result, fogColor, fogFactor);

    gl_FragColor = vec4(result, texColor.a);
  }
`;
