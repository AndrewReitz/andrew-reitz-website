precision highp float;

varying vec2 vTexCoord;

uniform vec2 boids[500];

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                            6.0)-3.0)-1.0,
                    0.0,
                    1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {   
    float bri = 0.;

    for (int i = 0; i < 500; i++) {
        vec2 b = boids[i];
        float d = distance(vTexCoord, vec2(b.x / 512., b.y / 512.));
        bri += 0.0003 / d;
    }

    // float s = smoothstep(0.2, 1.0, bri);
    // gl_FragColor = vec4(s, s, s, 1.0);

    // hsb
    gl_FragColor = vec4(hsb2rgb(vec3(bri, 1., 1.)), 1.);

    // float amplitude = 1.;
    // float frequency = 1.;
    // float s = amplitude * sin(bri * frequency);
    // gl_FragColor = vec4(s, s, s, 1.0);
}
