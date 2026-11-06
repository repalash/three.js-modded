# three-modded changelog

`three-modded` is three.js with the changes listed here. It is published on npm as
[`three-modded`](https://www.npmjs.com/package/three-modded) and installed in place of `three`
(`npm install three@npm:three-modded`), with the types in
[`three-types-modded`](https://www.npmjs.com/package/three-types-modded).

A version is `0.<three.js revision>.<1000n>`: `0.168.10008` is the 8th three-modded release on three.js r168.

For each three.js revision, this file has:
- **Changes over three.js**: what three-modded has that three.js of that revision does not.
- **Upgrading**: what changes for an app that moves to this revision from the one before. This covers both
  upstream and three-modded changes. The upstream changes are listed in full in the three.js
  [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).
- One section per release, newest first. **Breaking** marks a change that can need a change in an app.

## Unreleased

- **Breaking** `USDZLoader` is no longer exported from `three/addons` (`examples/jsm/Addons.js`), as in three.js r179.
  Use `USDLoader`, which loads `.usdz`, `.usda` and `.usdc` files:
  `import { USDLoader } from 'three/addons/loaders/USDLoader.js'` (or from `three/addons`).
  `three/addons/loaders/USDZLoader.js` is still there as a deprecated subclass of `USDLoader`.
- `USDLoader` from three.js r187, with USDC (binary) support. The editor opens `.usd`, `.usda` and `.usdc` files with it.
- `Loader.setPriority( 'high' | 'low' | 'auto' )` and `Loader.setCache( RequestCache )` from three.js r187. They set
  the `priority` and `cache` of the `fetch()` requests of a loader, and the core loaders pass them to the loaders they use.

## r168

### Changes over three.js r168

**WebGLRenderer**
- Parts of `render()` can be switched off in `renderer.userData`: `backgroundRender`, `shadowMapRender`, `sceneRender`,
  `opaqueRender`, `transparentRender`, `transmissionRender` and `renderTransmissionPass` (`false` skips that part).
  `userData.transmissionRenderTarget` sets the render target that transmissive materials sample, and
  `userData.blurTransmissionTarget` generates its mipmaps before the transmissive objects are drawn.
- The shadow maps are not rendered when no light casts shadows.
- `onContextLost( event )`, `onContextRestore()` and `onContextCreationError( event )` callbacks.
- `readRenderTargetPixels( ..., activeCubeFaceIndex, textureIndex )` reads one texture of a render target with several
  textures.
- `resetCurrentMaterial()`, so the next draw sets up its material again.
- `renderer.background`, `renderer.cubemaps`, `renderer.cubeuvmaps` and `renderer.materials` give access to the
  internal WebGL modules.
- `useLegacyLights` is a plain property without a deprecation warning.
- `scene.overrideMaterial` replaces only materials with `allowOverride === true` (see `Material.allowOverride`), also
  in `WebGPURenderer`. The background materials are never replaced.
- `material.userData.envMapSlotKey` picks the environment map of a material from `scene.textureSlots[ key ]` in place
  of `scene.environment`.
- `material.userData.separateEnvMapIntensity` uses `material.envMapIntensity` in place of `scene.environmentIntensity`.
- `material.extraUniformsToUpload`: uniforms uploaded for each object at each draw (set them in
  `onBeforeRender()`), except those with `needsUpdate === false`.
- `material.onAfterRender()` is called after each draw of the material.
- `geometry.userData.__forceUseTangent` uses the tangent attribute also without a normal map or anisotropy.
- A render target whose texture has a color space other than sRGB (for example `RGBM16ColorSpace`) is written in that
  color space. An sRGB render target is written in linear sRGB, as in three.js.

**Shaders and materials**
- Transmission: a material with `transmission > 0` is not opaque. The transmission texture is decoded by its color
  space. It is sampled without the bicubic filter at roughness 0, and with the roughness from `roughnessMap`.
  `attenuationDistance` 0 means no attenuation.
- Defines: `INVERSE_ALPHAMAP` (the alpha map is `1 - g`), `FIX_ENV_DIRECTION` (the environment map is sampled with the
  normal as it is), `USE_ANISOTROPY_BRDF` (the anisotropy BRDF functions without `USE_ANISOTROPY`), and
  `WebGL2Context` in WebGL 2 programs.
- GLSL functions `LinearToLinear`, `LinearTosRGB`, `sRGBToLinear`, `RGBM16ToLinear` and `LinearToRGBM16`.
- The alpha of the fragment is clamped to 0–1.
- `MeshPhysicalMaterial.reflectivity` can go up to 2.5 (for an IOR up to infinity), in place of 1.
- `Material.allowOverride` (default `true`), see `scene.overrideMaterial` above.
- `Material.copy()` copies `userData` by value, except textures, objects, materials and geometries, which are kept by
  reference, functions and keys that start with `__`. A value with a `clone()` method is cloned.
- `Material.setValues()` sets a vector or color property from an array. It does not warn about keys that are not
  properties of the material.
- The JSON of a material has `metadata.version` 4.6001.

**Background**
- `scene.background = 'environment'` shows `scene.environment`, with `scene.environmentIntensity` and
  `scene.environmentRotation`.
- `scene.backgroundColor` multiplies the background texture, or is the background when there is no texture.
- `texture.userData.flipX` and `flipY` flip a background texture.
- `WebGLBackground.getPlaneMesh()`, `getBoxMesh()` and `getBoxMesh2()`.

**Color spaces and textures**
- `RGBM16ColorSpace` (`'rgbm-16'`): a texture or render target stored as RGBM with a range of 16.
- `LinearEncoding`, `sRGBEncoding` and `Texture.encoding` (removed in three.js r162) are kept, with a warning, for old
  code and files. The JSON of a texture also has `encoding`.
- `Texture.needsUpdate = true` dispatches an `update` event. A texture created with an `ImageData` image is uploaded
  without `needsUpdate`.
- `Texture.copy()` and `toJSON()` skip the `userData` keys that start with `__`, functions, `appliedMaterials` and
  `uuid`.
- `Source.toJSON()` uses `image.url` when it is set, and warns when the data of a large texture cannot be serialized.
- Render targets apply changed texture parameters (for example `generateMipmaps`) when `texture.needsUpdate` is set,
  and handle render targets with several textures when generating mipmaps.

**Core**
- `Object3D` dispatches `beforeRender` and `afterRender` events from `onBeforeRender()` and `onAfterRender()`.
- `Object3D.copy()` keeps textures and objects in `userData` by reference, in place of a JSON copy that fails on them.
- `AnimationClip.userData`, kept in `clone()` and `toJSON()`.
- `BufferGeometry.center( targetOffset )` writes the offset it applied to `targetOffset`.
- `Mesh.copy()` and `InstancedMesh.copy()` copy only the `Object3D` part from an object of another type.
  `InstancedMesh.sourceTrs` holds the instance attributes of a glTF file with `EXT_mesh_gpu_instancing`.
- `LightShadow.copy()` copies `normalBias`. `RenderTarget.copy()` works when `depthTexture` is `undefined`.
- `ImageUtils.getDataURL( image, forcePng )` writes a PNG also for images over 2048 pixels.
- `WebXRManager.onPreAnimationFrameCallback( time, frame )`.

**Loaders**
- `Cache.get( key, type )` returns a promise when `type` is given, so an app can put an asynchronous cache behind
  `Cache`. `FileLoader.useCache` (default `true`).
- `ImageLoader` downloads with `FileLoader` and caches the image as a blob. SVG files without a content type get
  `image/svg+xml`. `ImageBitmapLoader` caches its blob too.
- `TextureLoader` sets `texture.userData.rootPath` to the url (not for `blob:` urls).
- `LoaderUtils.resolveURL()` returns a url that starts with `/` as it is when the path has no host.
- `MaterialLoader` and `ObjectLoader` read the colors of files with `metadata.version` 4.5 or lower (saved before
  three.js r152) as linear sRGB. `ObjectLoader` reads the `encoding` of old textures.

**Addons**
- `GLTFLoader`
  - `GLTFLoader.ObjectConstructors`: the classes it creates for lights, materials and cameras, which an app can
    replace.
  - `parse( data, path, onLoad, onError, url )`.
  - It reads texture and image `extras` written by threepipe and webgi: `uuid`, `colorSpace`, `flipY`, `uri`, and
    `t_uuid` / `t_colorSpace`.
  - An image with both a `bufferView` and a `uri` shows the embedded image first, then the one at the uri.
  - `texture.userData.rootPath` and `__sourceBlob`.
  - When `ImageBitmapLoader` fails (for example on an SVG), it loads the image again with `TextureLoader`.
  - `sheen` from `extras.sheenFactor`.
  - A material with the `WEBGI_material_extras` extension is not cloned for vertex colors or flat shading.
  - An invalid texture or image index warns instead of throwing.
- `GLTFExporter`
  - `parse( input, onDone, onError, options, gltfWriter )` takes a custom writer, and `GLTFWriter` is exported.
  - Options `ignoreInvalidMorphTargetTracks` (an animation that cannot be exported is left out) and
    `ignoreEmptyTextures` (a texture without an image is left out).
  - `GLTFWriter.processBufferViewImageBuffer( buffer )`, and `processImage()` with a `width` and `height`.
  - A compressed texture with `source._canSerialize` is written as it is.
  - Only JPEG and PNG images are written; another type logs an error.
  - The `userData` of animations goes to their `extras`, and `sheen` to `extras.sheenFactor`.
- `OrbitControls`
  - `autoPushTarget` and `autoPullTarget` move the target when zooming past `minDistance` or `maxDistance`.
  - `clampMin` and `clampMax` limit the position and the target.
  - `maxZoomSpeed` limits the damped zoom.
  - `dollyZoom` zooms a perspective camera by changing `zoom`.
  - `throttleUpdate` limits the updates per second. It is disabled for now.
  - `minDistance` is `0.00001`.
  - The mouse wheel zooms with damping when `enableDamping` is on, and takes `event.deltaMode` into account. Touch
    dolly is 6 times as fast.
  - New methods: `zoomIn( delta )`, `zoomOut( delta )`, `rotateUp( angle )`, `rotateLeft( angle )` and `stopDamping()`.
  - An update with nothing to apply leaves the camera position exactly as it is.
  - A pointer move without buttons ends the drag.
- `EXRExporter`: `options.textureIndex` for render targets with several textures, and `flipY` of a `DataTexture`.
  ZIP blocks that do not compress are stored as they are.
- `Rhino3dmLoader` (3DM)
  - An instance reference becomes a clone of its object, with its own material, layer visibility and attributes.
  - It keeps `userData.strings`, the geometry names and `warnings`.
- `DRACOLoader`, `KTX2Loader` and `Rhino3dmLoader` keep their worker code as a string, so it still works after the
  app is minified. `KTX2Loader.createTexture()` is public, and the loader sets `crossOrigin` on its file loader.
- `FBXLoader` releases the parse tree after a load.
- `BufferGeometryUtils.mergeVertices()` with a tolerance of 0 or less merges nothing.
  `mergeBufferGeometries()` and `mergeBufferAttributes()` (renamed in three.js r151) are kept.
- `RenderPass.render( ..., depthRenderBuffer )` renders with an external depth buffer, and does nothing without a scene
  or camera. `ShaderPass.useExistingRenderTarget`.
- `SVGRenderer` lights with the direction from a directional light to its target.

### 0.168.10008

- `OrbitControls`: an update with nothing to apply leaves the camera position exactly as it was set (#3).
- `EXRExporter`: ZIP compression writes the last, partial block correctly, and stores blocks that do not compress as
  they are (#4).

### 0.168.10007

- `OrbitControls`: a perspective dolly without damping applies the full delta (#1).
- `OrbitControls`: creating the controls no longer moves the camera (#2).

### 0.168.10006

- README only.

### 0.168.10005

- Published from CI. No code change.

### 0.168.10004

The first three-modded release on npm. It has the changes over three.js r168 above, including those of the
0.168.10001–0.168.10003 builds that were not published:
- The merge of three.js r168.
- `WebGLRenderer.resetCurrentMaterial()`.
- `GLTFLoader` reads the color space of a texture from the glTF `extras`. `texture.userData.rootPath` is the image uri
  as it is when the path starts with `/`.
- `EXRExporter` no longer crashes on render targets with several textures.
