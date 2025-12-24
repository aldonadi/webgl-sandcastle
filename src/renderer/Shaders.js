export const BasicVertexShader = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aTexCoord;

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  // Inverse Transpose of Model Matrix is needed for correct normal scaling
  // For uniform scaling, uModelMatrix is often "okay", but technically we need:
  uniform mat4 uNormalMatrix; 

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vTexCoord;

  void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    
    // Transform position to world space for lighting
    vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));
    
    // Transform normal to world space
    // We use mat3 of uNormalMatrix to rotate normals
    vNormal = mat3(uNormalMatrix) * aNormal;
    
    vTexCoord = aTexCoord;
  }
`;

export const BasicFragmentShader = `
  precision mediump float;

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vTexCoord;

  // Material
  uniform sampler2D uTexture;
  uniform vec3 uBaseColor; // Fallback or tint
  uniform float uSpecularIntensity; // 0.0 to 1.0
  uniform float uShininess; // e.g. 32.0

  // Light
  uniform vec3 uLightPos;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;
  
  // Camera
  uniform vec3 uViewPos;

  void main() {
    // 1. Texture Map
    vec4 texColor = texture2D(uTexture, vTexCoord);
    vec3 objectColor = texColor.rgb * uBaseColor;

    // 2. Ambient
    vec3 ambient = uAmbientColor * objectColor;

    // 3. Diffuse
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor * objectColor;

    // 4. Specular (Blinn-Phong)
    vec3 viewDir = normalize(uViewPos - vFragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), uShininess);
    vec3 specular = uLightColor * spec * uSpecularIntensity; // Specular usually white/lightcol, disjoint from object color

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, texColor.a);
  }
`;
