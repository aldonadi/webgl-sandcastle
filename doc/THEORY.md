# Theory of 3D Graphics & WebGL

This document provides an in-depth dive into the mathematical and theoretical foundations used in this project. It covers the journey from raw numbers to pixelated images on your screen.

---

## 1. Mathematical Foundations: Linear Algebra

At the heart of 3D graphics lies **Linear Algebra**, specifically the manipulation of vectors and matrices.

### Vectors
A vector is an entity that has both magnitude and direction. In 3D graphics, we primarily use 3D vectors $(x, y, z)$ to represent:
1. **Positions**: A point in 3D space.
2. **Directions**: Where an object is facing (e.g., Camera Forward vector).
3. **Scales**: How big an object is in each dimension.

### Matrices
A matrix is a rectangular array of numbers. In 3D graphics, we almost exclusively use **4x4 Matrices**. Why 4x4 if we are in 3D (3 dimensions)? 

We use a system called **Homogeneous Coordinates**. By adding a 4th component $w$ (usually 1 for points, 0 for directions), we can represent linear transformations (rotation, scale) AND affine transformations (translation) in a single matrix multiplication.

A 4x4 matrix looks like this:
$$
\mathbf{M} = \begin{bmatrix}
m_{00} & m_{01} & m_{02} & m_{03} \\
m_{10} & m_{11} & m_{12} & m_{13} \\
m_{20} & m_{21} & m_{22} & m_{23} \\
m_{30} & m_{31} & m_{32} & m_{33}
\end{bmatrix}
$$

**Matrix Multiplication** is the tool we use to apply transformations. If we have a vertex $v$ and we want to translate it using matrix $T$, the new position $v'$ is:
$$ v' = T \times v $$
*Note: In column-major order (WebGL standard), the vector is on the right.*

---

## 2. Transformation Matrices

Let's look at the specific matrices we construct in `src/math/Matrix4.js`.

### Identity Matrix
The "do nothing" matrix. Used as a starting point.
$$
\mathbf{I} = \begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

### Translation Matrix
Moves a point by $(t_x, t_y, t_z)$.
$$
\mathbf{T} = \begin{bmatrix}
1 & 0 & 0 & t_x \\
0 & 1 & 0 & t_y \\
0 & 0 & 1 & t_z \\
0 & 0 & 0 & 1
\end{bmatrix}
$$
*Note: In memory (Flat array), $t_x$ is at index 12, $t_y$ at 13, $t_z$ at 14.*

### Scaling Matrix
Multiplies the size by $(s_x, s_y, s_z)$.
$$
\mathbf{S} = \begin{bmatrix}
s_x & 0 & 0 & 0 \\
0 & s_y & 0 & 0 \\
0 & 0 & s_z & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

### Rotation Matrices
Rotation is more complex and depends on the axis.
**Rotation around X-axis ($\theta$):**
$$
\mathbf{R_x} = \begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & \cos\theta & -\sin\theta & 0 \\
0 & \sin\theta & \cos\theta & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

### The Model Matrix
The **Model Matrix** combines all the above for a specific object. The order matters! usually:
$$ \mathbf{M_{model}} = \mathbf{T} \times \mathbf{R} \times \mathbf{S} $$
*(Scale first, then Rotate, then Translate).*

---

## 3. Coordinate Systems

To render a scene, we transform a vertex through several "spaces".

1. **Local Space (Object Space)**: The coordinates of the vertex relative to the object center. (e.g., A cube corner at $1,1,1$).
2. **World Space**: Where the object is in the scene. transform via **Model Matrix**.
3. **View Space (Camera Space)**: Where the object is relative to the camera. Transform via **View Matrix**.
4. **Clip Space**: A simplified cube volume $(-1 \text{ to } 1)$ where perspective distortion is applied. Transform via **Projection Matrix**.
5. **Screen Space**: The actual pixels on your monitor (0 to 1920, etc). Handled by the Viewport.

### Coordinate Transformation Pipeline
$$ V_{clip} = \mathbf{M_{projection}} \times \mathbf{M_{view}} \times \mathbf{M_{model}} \times V_{local} $$

This is precisely what our Vertex Shader does:
```glsl
gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
```

---

## 4. Hand Calculation Example

Let's transform a point $P(1, 0, 0)$ on a cube.
We want to:
1. Scale it by 2 ($S$).
2. Rotate it $90^\circ$ around Z ($R_z$).
3. Translate it to $x=3$ ($T$).

**Step 1: Scale**
$$
P' = S \times P = \begin{bmatrix}2&0&0&0\\0&2&0&0\\0&0&2&0\\0&0&0&1\end{bmatrix} \begin{bmatrix}1\\0\\0\\1\end{bmatrix} = \begin{bmatrix}2\\0\\0\\1\end{bmatrix}
$$
*Point is now at x=2.*

**Step 2: Rotate ($90^\circ$ on Z)**
$$
P'' = R_z \times P' = \begin{bmatrix}\cos(90)&-\sin(90)&0&0\\\sin(90)&\cos(90)&0&0\\0&0&1&0\\0&0&0&1\end{bmatrix} \begin{bmatrix}2\\0\\0\\1\end{bmatrix}
$$
$$ = \begin{bmatrix}0&-1&0&0\\1&0&0&0\\0&0&1&0\\0&0&0&1\end{bmatrix} \begin{bmatrix}2\\0\\0\\1\end{bmatrix} = \begin{bmatrix}0\\2\\0\\1\end{bmatrix} $$
*Point rotated $90^\circ$ from X-axis to Y-axis. Now at y=2.*

**Step 3: Translate ($x=3$)**
$$
P''' = T \times P'' = \begin{bmatrix}1&0&0&3\\0&1&0&0\\0&0&1&0\\0&0&0&1\end{bmatrix} \begin{bmatrix}0\\2\\0\\1\end{bmatrix} = \begin{bmatrix}3\\2\\0\\1\end{bmatrix}
$$
*Point moved 3 units right. Final World coordinate.*

---

## 5. The Graphics Pipeline

The Graphics Pipeline is the sequence of steps the GPU takes to process visual data.

### 1. Input Assembler
Takes your raw buffers (Vertices, Indices) and assembles them into primitives (Triangles, Lines).
*Component used*: `Mesh.js` buffers.

### 2. Vertex Shader (Programmable)
**Input**: Single Vertex attributes (Position, Color, Normal).
**Function**: Transforms position from Local Space $\to$ Clip Space.
**Output**: `gl_Position` (Clip coordinates) + Varyings (Color, etc).
*Where*: `src/renderer/Shaders.js` (BasicVertexShader).

### 3. Rasterization (Fixed Function)
The "magic" step. The GPU determines which pixels on the screen are covered by the triangle defined by the vertex shader outputs. Interpolates values (smooth colors) across the triangle face.

### 4. Fragment Shader (Programmable)
**Input**: Interpolated values (Varyings) for a specific pixel.
**Function**: Calculates the final color of the pixel. Can include lighting, textures, shadows.
**Output**: `gl_FragColor` (RGBA).
*Where*: `src/renderer/Shaders.js` (BasicFragmentShader).

### 5. Output Merger
Mixes the fragment shader output with the existing image buffer (Depth testing, Blending).

---

## 6. Shaders Deep Dive

Shaders are small programs that run **on the GPU**, not the CPU. They are massively parallel. A 1080p screen has ~2 million pixels; the Fragment Shader runs 2 million times *per frame*.

### Language: GLSL (OpenGL Shading Language)
It looks like C.
- `attribute`: Input per-vertex (from JS buffer).
- `uniform`: Global variable (same for all vertices in a draw call, like Matrices).
- `varying`: Variable passed from Vertex $\to$ Fragment shader (interpolated).
- `vec3`, `mat4`: Built-in types for math.

### Where do they live?
They are compiled by the graphics driver at runtime (in `ShaderProgram.js`) and uploaded to the GPU memory.

### Visual Effect Example
To make the color pulse over time:

1. **Update JS**:
   Send a time uniform.
   ```javascript
   const uTime = gl.getUniformLocation(program, 'uTime');
   gl.uniform1f(uTime, performance.now() / 1000);
   ```

2. **Update Fragment Shader**:
     gl_FragColor = vec4(vColor * brightness, 1.0);
}
```
This calculates a new color for every pixel, every frame, creating a pulsing animation without changing the geometry.

---

## 7. Texturing & Procedural Generation

### Texture Mapping (UV Coordinates)
To "wrap" a 2D image (Texture) around a 3D object, we use **UV Coordinates**.
- **$U$**: The horizontal axis of the texture ($0 \to 1$).
- **$V$**: The vertical axis of the texture ($0 \to 1$).

Each vertex gets a $(u, v)$ pair. The GPU interpolates these values across the triangle.
For a square face, the corners might be: $(0,0), (1,0), (1,1), (0,1)$.

In the fragment shader, we sample the texture using these interpolated coordinates:
```glsl
vec4 color = texture2D(uTexture, vTexCoord);
```

### Procedural Generation
Instead of loading an image file (PNG/JPG), we generate textures algorithmically using the CPU (HTML5 Canvas) before uploading to the GPU.

**Perlin Noise / Randomness**:
We create organic patterns by manipulating pixel data directly using random values.
$$ C_{pixel} = C_{base} + \text{noise}(x, y) \times \text{intensity} $$
Where $\text{noise}(x, y)$ returns a random value between $-1.0$ and $1.0$.

---

## 8. Lighting Theory: Blinn-Phong Model

We use the **Blinn-Phong Reflection Model** to simulate realistic lighting. It consists of three components:

$$ I_{total} = I_{ambient} + I_{diffuse} + I_{specular} $$

### 1. Ambient
A constant base light that ensures no part of the scene is pitch black. Simulates indirect light scattering.
$$ I_{ambient} = K_{ambient} \times C_{light} $$

### 2. Diffuse (Lambertian)
Simulates directional light hitting a matte surface. It depends on the angle between the **Surface Normal** ($\mathbf{N}$) and the **Light Direction** ($\mathbf{L}$).
$$ I_{diffuse} = \max(\mathbf{N} \cdot \mathbf{L}, 0) \times C_{light} $$
*If the dot product is 0 or negative (facing away), the light contributes nothing.*

### 3. Specular (Blinn-Phong)
Simulates the bright white "shiny spot" on glossy surfaces. It depends on the view direction.
Blinn-Phong uses the **Halfway Vector** ($\mathbf{H}$), which is halfway between the Light Direction ($\mathbf{L}$) and View Direction ($\mathbf{V}$).

$$ \mathbf{H} = \frac{\mathbf{L} + \mathbf{V}}{||\mathbf{L} + \mathbf{V}||} $$

$$ I_{specular} = (\max(\mathbf{N} \cdot \mathbf{H}, 0))^{\alpha} \times I_{intensity} $$
Where $\alpha$ is the **Shininess** factor (e.g., 32 or 64). Higher shininess = smaller, sharper highlight.

---

## 9. Bump Mapping & Normal Mapping

Bump Mapping involves simulating surface detail (like bricks or sand grains) without adding millions of triangles.

### Tangent Space Normal Mapping
We use a **Normal Map**, a texture where RGB values represent $(x, y, z)$ components of a surface normal vector.
- **R**: Deviation in Tangent (X) direction.
- **G**: Deviation in Bitangent (Y) direction.
- **B**: Deviation in Normal (Z) direction.

To use this, we need a coordinate system aligned with the surface texture: **Tangent Space**.
We construct a **TBN Matrix** (Tangent, Bitangent, Normal) at each vertex:
$$ \mathbf{TBN} = \begin{bmatrix} | & | & | \\ \mathbf{T} & \mathbf{B} & \mathbf{N} \\ | & | & | \end{bmatrix} $$

In the Fragment Shader, we do:
1. Sample the Normal map color ($0 \to 1$).
2. Remap to vector range ($-1 \to 1$): `n = color * 2.0 - 1.0`.
3. Transform this vector from Tangent Space to World Space using the TBN matrix.
4. Use this new "perturbed" normal for lighting calculations.

This makes flat surfaces appear rough/bumpy because light bounces off them as if they had complex geometry.


