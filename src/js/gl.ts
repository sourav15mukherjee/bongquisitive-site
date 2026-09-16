/** Minimal WebGL helper: fullscreen-quad programs without any library. */

export interface GLProgram {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  use(): void;
  uniform(name: string): WebGLUniformLocation | null;
  setVec2(name: string, x: number, y: number): void;
  setVec3(name: string, x: number, y: number, z: number): void;
  setVec4Array(name: string, data: Float32Array): void;
  setFloat(name: string, v: number): void;
  setInt(name: string, v: number): void;
}

export function createProgram(
  canvas: HTMLCanvasElement,
  vertSrc: string,
  fragSrc: string,
): GLProgram | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Link error:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const cache = new Map<string, WebGLUniformLocation | null>();
  const uniform = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
    return cache.get(name)!;
  };

  return {
    gl,
    program,
    use: () => gl.useProgram(program),
    uniform,
    setVec2: (n, x, y) => gl.uniform2f(uniform(n), x, y),
    setVec3: (n, x, y, z) => gl.uniform3f(uniform(n), x, y, z),
    setVec4Array: (n, data) => gl.uniform4fv(uniform(n), data),
    setFloat: (n, v) => gl.uniform1f(uniform(n), v),
    setInt: (n, v) => gl.uniform1i(uniform(n), v),
  };
}

/** Upload a canvas (2D) as a texture. Returns the texture. */
export function canvasToTexture(gl: WebGLRenderingContext, source: HTMLCanvasElement): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
