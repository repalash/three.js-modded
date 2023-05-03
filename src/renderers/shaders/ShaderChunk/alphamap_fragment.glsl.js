export default /* glsl */`
#ifdef USE_ALPHAMAP

	#if defined(INVERSE_ALPHAMAP) && INVERSE_ALPHAMAP >= 1

	diffuseColor.a *= 1.0-texture2D( alphaMap, vAlphaMapUv ).g;

	#else

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

	#endif

#endif
`;
