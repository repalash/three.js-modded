export const vertex = /* glsl */`
#ifdef HAS_TEXTURE

varying vec2 vUv;
uniform mat3 uvTransform;

uniform bool flipX;
uniform bool flipY;

#endif

void main() {

#ifdef HAS_TEXTURE

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

    vUv = flipX ? vec2( 1.0 - vUv.x, vUv.y ) : vUv;
    vUv = flipY ? vec2( vUv.x, 1.0 - vUv.y ) : vUv;

#endif

	gl_Position = vec4( position.xy, 1.0, 1.0 );

}
`;

export const fragment = /* glsl */`
#ifdef HAS_TEXTURE

uniform sampler2D t2D;
varying vec2 vUv;

#endif

uniform float backgroundIntensity;
uniform vec3 backgroundColor;


void main() {

#ifdef HAS_TEXTURE

	vec4 texColor = texture2D( t2D, vUv );

#else

	vec4 texColor = vec4( 1.0 );

#endif

	texColor.rgb *= backgroundColor * backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <encodings_fragment>

}
`;
