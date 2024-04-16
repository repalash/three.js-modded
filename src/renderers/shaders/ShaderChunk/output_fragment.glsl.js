export default /* glsl */`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
diffuseColor.a = min(max(diffuseColor.a, 0.), 1.);
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;
