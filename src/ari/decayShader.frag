precision highp float;

varying vec2 vTexCoord;

uniform sampler2D trailMap;
uniform float deltaTime;

uniform float decayRate;
uniform float diffuseRate;

uniform float resolution;

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  
  vec4 sum = vec4(0.0);
  vec4 originalCol = texture2D(trailMap, uv);
  float offset = 1.0 / resolution;
  for (float offsetX = -1.0; offsetX <= 1.0; offsetX++) {
      for (float offsetY = -1.0; offsetY <= 1.0; offsetY++) {
          float sampleX = min(1.0, max(0.0, uv.x + offsetX / resolution));
          float sampleY = min(1.0, max(0.0, uv.y + offsetY / resolution));
          sum +=  texture2D(trailMap, vec2(sampleX, sampleY));
      }
  }

  vec4 blurredCol = sum / 9.0;
  float diffuseWeight = diffuseRate;
  blurredCol = originalCol * (1. - diffuseWeight) + blurredCol * diffuseWeight;
  
  gl_FragColor = max(vec4(0.), blurredCol - decayRate);
}
