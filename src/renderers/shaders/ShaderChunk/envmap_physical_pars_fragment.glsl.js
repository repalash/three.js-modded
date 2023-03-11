export default /* glsl */`
#if defined( USE_ENVMAP )

	vec3 getIBLIrradiance( const in vec3 normal ) {

		#if defined( ENVMAP_TYPE_CUBE_UV )

		#if defined( FIX_ENV_DIRECTION )
			vec3 worldNormal = normal;
		#else
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#endif

			worldNormal = transformDirection(worldNormal, rotationMatrix(vec3(0,1,0), envMapRotation));

			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

			return PI * envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

		#if defined( ENVMAP_TYPE_CUBE_UV )

			vec3 reflectVec = reflect( - viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

			#if !defined( FIX_ENV_DIRECTION )

			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

			#endif

			reflectVec = transformDirection(reflectVec, rotationMatrix(vec3(0,1,0), envMapRotation));

			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );

			return envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

#endif
`;
