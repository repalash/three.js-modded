# three-modded changelog

`three-modded` is three.js with the changes listed here. It is published on npm as
[`three-modded`](https://www.npmjs.com/package/three-modded) and installed in place of `three`
(`npm install three@npm:three-modded`), with the types in
[`three-types-modded`](https://www.npmjs.com/package/three-types-modded).

A version is `0.<three.js revision>.<10000 + n>`: `0.168.10008` is the 8th three-modded build on three.js r168 (the
first three were not published on npm).

For each three.js revision, this file has:
- **Changes over three.js**: what three-modded has that three.js of that revision does not.
- **Upgrading** (from r172 on): what changes for an app that moves to this revision from the one before. This covers
  both upstream and three-modded changes. r168 is the first revision in this file. The upstream changes are listed in full in the three.js
  [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).
- One section per release, newest first. **Breaking** marks a change that can need a change in an app.

## r177

### Changes over three.js r177

All the [changes over three.js r168](#changes-over-threejs-r168), except those that three.js r177 has itself:
`Material.allowOverride`, `LightShadow.copy()` of `normalBias`, and `textureIndex` in `readRenderTargetPixels()` and
`readRenderTargetPixelsAsync()`. And:
- `USDLoader` from three.js r187, with USDC (binary) support: `.usdz`, `.usd`, `.usda` and `.usdc` files. The editor
  opens them with it.
- `Loader.setPriority( 'high' | 'low' | 'auto' )` and `Loader.setCache( RequestCache )` from three.js r187. They set
  the `priority` and `cache` of the `fetch()` requests of a loader, and the core loaders pass them to the loaders they
  use.
- `ColorManagement`: `RGBM16ColorSpace` is a registered color space, linear sRGB for color management. With
  `NoColorSpace` as the output color space, the canvas stays sRGB: the app encodes the final colors itself, for example
  in a screen pass.
- `GLTFExporter`: the `writeMesh`, `writeNode`, `beforeParse` and `afterParse` hooks of a plugin can return a promise,
  and the writer waits for it.
- `ImageLoader`: a failing cache lookup calls `onError` instead of leaving the load pending.

### Upgrading from r172

From three-modded:
- **Breaking** (also in 0.172.10001-rc.2) `USDZLoader` is no longer exported from `three/addons`, as in three.js r179.
  Use `USDLoader`, which loads `.usdz`, `.usd`, `.usda` and `.usdc` files:
  `import { USDLoader } from 'three/addons/loaders/USDLoader.js'` (or from `three/addons`).
  `three/addons/loaders/USDZLoader.js` is still there as a deprecated subclass of `USDLoader`.
- **Breaking** `ImageUtils.getDataURL( image, forcePng )` is three.js r177's `getDataURL( image, type = 'image/png' )`,
  which no longer switches to JPEG for images over 2048 pixels. Pass a MIME type, or nothing for PNG, in place of
  `forcePng`.
- The JSON of objects, materials, textures and geometries has `metadata.version` 4.7 (three.js r177), in place of
  4.6001 for materials. Files saved with 4.6 or lower are still read as before.

From three.js r173–r177, the changes most likely to need a change in an app (all of them are in the
[Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)):
- r173: `MeshGouraudMaterial` is deprecated (use `MeshLambertMaterial`). TSL `varying()` and `vertexStage()` are
  `toVarying()` and `toVertexStage()`.
- r174: **Breaking** `Timer` no longer listens to page visibility by itself: call `timer.connect( document )`.
  `RenderTarget.clone()` clones its textures instead of sharing them.
- r175: **Breaking** `Controls.connect()` needs a DOM element. `ParametricGeometries` is `ParametricFunctions`. The
  constructors of `LUTImageLoader`, `SMAAPass` and `HalftonePass` changed. `AnimationClip.parseAnimation()` is
  deprecated.
- r176: **Breaking** the `length` parameter of `CapsuleGeometry` is `height`. `GLTFLoader` no longer detects WebP and
  AVIF support. `LottieLoader` is deprecated.
- r177: **Breaking** `ColorManagement.fromWorkingColorSpace()` and `toWorkingColorSpace()` are
  `workingToColorSpace()` and `colorSpaceToWorking()`. `GLTFExporter` writes parent nodes before their children.
  `PeppersGhostEffect` is removed.

### 0.177.10001-rc.1

The first release candidate of the r177 merge, under the npm dist-tag `three-r177`. It also has `USDLoader` and
`Loader.setPriority()` / `setCache()` from `master` (#10, #11).

## r168

### Changes over three.js r168

**WebGLRenderer**
- Parts of `render()` can be switched off in `renderer.userData`: `backgroundRender`, `shadowMapRender`, `sceneRender`,
  `opaqueRender` and `transparentRender` (`false` skips that part).
- Transmission:
  - `userData.transmissionRenderTarget`, when set, is the render target that transmissive materials sample, in place of
    the one of the built-in transmission pass.
  - With `userData.transmissionRender` set (to anything), or `userData.renderTransmissionPass === false`, the built-in
    transmission pass is skipped (except for an `ArrayCamera`). Transmissive objects are still drawn;
    `transmissionRender === false` leaves them out.
  - In that case, `userData.blurTransmissionTarget` generates the mipmaps of `userData.transmissionRenderTarget` before
    the transmissive objects are drawn.
- **Breaking** Transparent objects are drawn before transmissive ones: the order is opaque, transparent, transmissive
  (three.js: opaque, transmissive, transparent), so they can blend differently where they overlap.
- `onContextLost( event )`, `onContextRestore()` and `onContextCreationError( event )` callbacks.
- `readRenderTargetPixels( ..., activeCubeFaceIndex, textureIndex )` reads one texture of a render target with several
  textures.
- `resetCurrentMaterial()`, so the next draw sets up its material again.
- `renderer.background`, `renderer.cubemaps`, `renderer.cubeuvmaps` and `renderer.materials` give access to the
  internal WebGL modules (`materials.refreshTransformUniform` too).
- `useLegacyLights` (removed in three.js r165) is accepted, for old code, and has no effect.
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
- Transmission: a material with `transmission > 0` is not opaque. The transmission render target is decoded by its
  color space (linear sRGB, sRGB or `RGBM16ColorSpace`, from `userData.transmissionRenderTarget`). It is sampled
  without the bicubic filter at roughness 0, and with the roughness from `roughnessMap`. `attenuationDistance` 0 means
  no attenuation. The alpha of transmissive fragments is clamped to 0–1.
- A `ShaderMaterial` with a `transmission` property gets the `transmission`, `transmissionSamplerMap` and
  `transmissionSamplerSize` uniforms filled in.
- Defines:
  - `INVERSE_ALPHAMAP` (with a value of 1 or more): the alpha map is `1 - g`.
  - `FIX_ENV_DIRECTION`: the environment map is sampled with the normal as it is.
  - `USE_ANISOTROPY_BRDF`: the anisotropy BRDF functions without `USE_ANISOTROPY`.
  - `WebGL2Context` in the fragment shaders of non-raw materials.
  - `USE_INSTANCING` and `USE_INSTANCING_COLOR` in fragment shaders too.
- GLSL functions `LinearToLinear`, `LinearTosRGB`, `sRGBToLinear`, `RGBM16ToLinear` and `LinearToRGBM16`.
- `MeshPhysicalMaterial.reflectivity` can go up to 2.5 (for an IOR up to infinity), in place of 1.
- `Material.allowOverride` (default `true`), see `scene.overrideMaterial` above. `copy()` and `toJSON()` do not carry it.
- `Material.copy()` copies `userData` by value: textures, objects, materials, geometries and values with
  `userDataSkipClone` are kept by reference, functions and keys that start with `__` are skipped, and a value with a
  `clone()` method is cloned.
- `Material.setValues()` sets a vector or color property from an array. It does not warn about keys that are not
  properties of the material.
- The JSON of a material has `metadata.version` 4.6001.

**Background**
- `scene.background = 'environment'` shows `scene.environment`. A PMREM environment, or a cube one without
  `backgroundBlurriness`, also takes `scene.environmentIntensity` and `scene.environmentRotation`; an equirectangular
  one does not.
- For a 2D background texture: `scene.backgroundColor` multiplies it, or is the background when there is no texture, and
  `texture.userData.flipX` and `flipY` flip it.
- `WebGLBackground.getPlaneMesh()`, `getBoxMesh()` and `getBoxMesh2()`.

**Color spaces and textures**
- `RGBM16ColorSpace` (`'rgbm-16'`): a texture or render target stored as RGBM with a range of 16.
- `LinearEncoding`, `sRGBEncoding` and `Texture.encoding` (removed in three.js r162) are kept, with a warning, for old
  code and files. The JSON of a texture also has `encoding`.
- `Texture.needsUpdate = true` dispatches an `update` event. A texture created with an `ImageData` image is uploaded
  without `needsUpdate`.
- `Texture.copy()` merges into the existing `userData`, and it and `toJSON()` skip the `userData` keys that start with
  `__`, functions, `appliedMaterials` and `uuid`.
- `Source.toJSON()` uses `image.url`, when it is set, for an image that is not an image element, canvas or bitmap and
  has no data. It warns when the data of a large texture cannot be serialized.
- Render targets apply changed texture parameters (for example `generateMipmaps`) when `texture.needsUpdate` is set.

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
  `Cache`.
- `FileLoader`:
  - `useCache` (default `true`). With `useCache = false` the loading manager is not told about the request
    (`itemStart` / `itemEnd`).
  - `responseType` defaults to `'text'`.
  - `load()` looks in the cache asynchronously, so the request starts a microtask later.
- `ImageLoader` downloads with `FileLoader` and caches the image as a blob:
  - `image.src` is a `blob:` url, not the url that was loaded.
  - The request is a `fetch()` with `credentials: 'same-origin'`: `crossOrigin = 'use-credentials'`, `requestHeader`
    and `withCredentials` do not apply.
  - SVG files without a content type get `image/svg+xml`, and a cached blob of type `text/plain` is not used.
  - `ImageBitmapLoader` caches its blob too.
- `TextureLoader` sets `texture.userData.rootPath` to the url (not for `blob:` urls).
- `LoaderUtils.resolveURL()` returns a url that starts with `/` as it is when the path has no host.
- `MaterialLoader` reads the colors of a material JSON with `metadata.version` 4.5 or lower (saved before three.js
  r152) as linear sRGB. `ObjectLoader` reads the `encoding` of old textures. (It has the same color check, but the
  objects and materials of a scene JSON have no `metadata`, so it does not apply there.)

**Addons**
- `GLTFLoader`
  - `GLTFLoader.ObjectConstructors`: the classes it creates for lights, materials and cameras, which an app can
    replace.
  - `GLTFParser` and `GLTFBinaryExtension` are exported. `parse()` takes a fifth argument, `url`, which is not used yet.
  - It reads the `extras` written by threepipe and webgi:
    - sampler `extras`: `uuid` and `colorSpace` of the texture;
    - image `extras`: `flipY`, `uuid` (of the source), `uri`, `t_uuid` and `t_colorSpace` (of the texture);
    - material `extras.uuid` as the material's uuid;
    - mesh `extras.isGeometryUserData`: the mesh's `extras` and the primitive's extensions go to `geometry.userData`;
    - animation `extras` as `AnimationClip.userData`;
    - `extras.sheenFactor` as `sheen`, for a material with `KHR_materials_sheen`.
  - `KHR_texture_transform` does not clone a texture whose uuid came from the `extras`.
  - An image with both a `bufferView` and a `uri` shows the embedded image first, then the one at the uri
    (`loadImageSource( sourceIndex, loader, preferUri, skipCache )`).
  - `texture.userData.rootPath` and `__sourceBlob`.
  - When `ImageBitmapLoader` fails (for example on an SVG), it loads the image again with `TextureLoader`.
  - For a mesh with several primitives, the mesh's extensions also go to the `userData` of each primitive's mesh.
  - A material with the `WEBGI_material_extras` extension is not cloned for vertex colors or flat shading.
  - An invalid texture or image index warns instead of throwing.
- `GLTFExporter`
  - `parse( input, onDone, onError, options, gltfWriter )` takes a custom writer. The writer class is
    `GLTFExporter.Utils.GLTFWriter`.
  - Options `ignoreInvalidMorphTargetTracks` (an animation that cannot be exported is left out) and
    `ignoreEmptyTextures` (a texture without an image is left out).
  - `GLTFWriter.processBufferViewImageBuffer( buffer )`, and `processImage()` with a `width` and `height`.
  - A compressed texture with `source._canSerialize` is written as it is.
  - Only JPEG and PNG images are written (`image/jpg` is read as `image/jpeg`). A texture with another type logs an
    error and is written with `source: null`.
  - The `userData` of animations goes to their `extras`. `sheen` is written from 0.001 (three.js: when not 0), and
    also to `extras.sheenFactor`.
- `OrbitControls`
  - **Breaking** `autoPushTarget` and `autoPullTarget` (both `true` by default) move the target when zooming past
    `minDistance` or `maxDistance`, instead of stopping there.
  - `clampMin` and `clampMax` limit the position and the target.
  - `maxZoomSpeed` limits the zoom of the wheel, `zoomIn()` and `zoomOut()`.
  - `dollyZoom` also changes the `zoom` of a perspective camera (0.1 to 20) when dollying.
  - `throttleUpdate` limits the updates per second. It is disabled for now.
  - `minDistance` is `0.00001`.
  - **Breaking** Zoom steps:
    - The mouse wheel on a perspective camera, without `zoomToCursor`, zooms by its `deltaY` (in lines, pages or pixels
      by `event.deltaMode`), damped when `enableDamping` is on.
    - Otherwise each wheel or drag step zooms by `0.95 ^ zoomSpeed`, whatever its size.
    - With `enableDamping` on, a perspective camera without `zoomToCursor` does not dolly with a mouse drag (the
      middle button by default).
    - Touch dolly is 6 times as fast.
  - New methods: `zoomIn( delta )`, `zoomOut( delta )`, `rotateUp( angle )`, `rotateLeft( angle )` and `stopDamping()`.
  - An update with nothing to apply leaves the camera position exactly as it is. While damping, every update
    dispatches `change`.
  - A pointer move without buttons ends the drag. With `zoomToCursor`, a dolly drag zooms to the pointer's `clientY`
    (three.js r168 passes `clientX` twice).
- `EXRExporter`: `options.textureIndex` for render targets with several textures, and `flipY` of a `DataTexture`.
  The last, partial ZIP block is written correctly, and blocks that do not compress are stored as they are.
- `Rhino3dmLoader` (3DM)
  - An instance reference whose definition has one object becomes a clone of that object, with its own material,
    layer visibility and attributes. With several objects it stays a group, with a warning.
  - It keeps `userData.strings` and the geometry names, clears `warnings` after each load, and turns off mipmaps for
    its TextDot textures.
- `DRACOLoader`, `KTX2Loader` and `Rhino3dmLoader` keep their worker code as a string, so it still works after the
  app is minified (`KTX2Loader.BasisWorker` is a string).
- **Breaking** `KTX2Loader._createTexture()` is `createTexture()`.
- `FBXLoader` releases the parse tree after a load.
- `BufferGeometryUtils.mergeVertices()` with a tolerance of 0 or less merges nothing.
  `mergeBufferGeometries()` and `mergeBufferAttributes()` (renamed in three.js r151) are kept.
- `RenderPass.render( ..., depthRenderBuffer )` renders with an external depth buffer, and does nothing without a scene
  or camera. `ShaderPass.useExistingRenderTarget`, and `ShaderPass` works without a read or write buffer.
- `SVGRenderer` lights with the direction from a directional light to its target.

### 0.168.10008

- `OrbitControls`: an update with nothing to apply leaves the camera position exactly as it was set (#3).
- `EXRExporter`: ZIP compression writes the last, partial block correctly, and stores blocks that do not compress as
  they are (#4).
- `Texture` can be created where `ImageData` is not defined, such as Node.js; it threw a `ReferenceError` (#5).

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
