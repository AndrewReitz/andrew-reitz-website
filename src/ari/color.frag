precision highp float;

varying vec2 vTexCoord;

uniform sampler2D trailMap;
uniform float time;

uniform int colorMode;
uniform vec3 background;
uniform vec3 particleColor;
uniform vec3 particleColor2;

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                            6.0)-3.0)-1.0,
                    0.0,
                    1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  vec4 originalCol = texture2D(trailMap, uv);
  
  // single color
  if (colorMode == 0) {
    vec3 colorMix = mix(particleColor2, particleColor, originalCol.x);
    gl_FragColor = vec4(mix(background, colorMix, originalCol.x), 1.0);
  }

  // two color
  if (colorMode == 1) {
    vec3 colorMix; //= mix(particleColor, particleColor2, originalCol.x * 1.3);

    if (originalCol.x < 0.3) {
      colorMix = particleColor;
    } else {
      colorMix = particleColor2;
    }

    gl_FragColor = vec4(mix(background, colorMix, originalCol.x), 1.0);
    // vec3 color = mix(particleColor, particleColor2, abs(sin(uv.y + time * 0.0001)));
    // gl_FragColor = vec4(mix(background, color, originalCol.x), 1.0);
  }

  // rainbow dash
  if (colorMode == 2) {
    vec3 t = originalCol.xxx * hsb2rgb(vec3(uv.y, 1.0, 1.0));
    gl_FragColor = vec4(mix(t, vec3(1.0, 1., 1.0), originalCol.x), 1.0);
  }

  if (colorMode == 3) {
    gl_FragColor = vec4(
      mix(
        vec3(0., 0., 0.),
        hsb2rgb(vec3(uv.x + time * 0.0001, 1.0, 1.0)),
        originalCol.x
      ), 
      1.);
  }

  if (colorMode == 4) {
    gl_FragColor = vec4(
      mix(
        vec3(1., 1., 1.),
        hsb2rgb(vec3(uv.x + time * 0.0001, 1.0, 1.0)),
        originalCol.x
      ), 
      1.);
  }

  if (colorMode == 5) {
    vec3 hsb = hsb2rgb(vec3(1.0 - originalCol.x, 1.0, 1.0));
    vec3 a = smoothstep(vec3(.9, 0., 0.), vec3(0.8), hsb);
    gl_FragColor = vec4(a, 1.);
  }
}

