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

  // Light
  uniform vec3 uLightPos;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;
  
  // Camera
  uniform vec3 uViewPos;

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

    // 3. Ambient
    vec3 ambient = uAmbientColor * objectColor;

    // 4. Diffuse (Blinn-Phong uses N dot L)
    vec3 lightDir = normalize(uLightPos - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor * objectColor;

    // 5. Specular (Blinn-Phong)
    vec3 viewDir = normalize(uViewPos - vFragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), uShininess);
    vec3 specular = uLightColor * spec * uSpecularIntensity; 

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, texColor.a);
  }
`;
