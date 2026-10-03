import { Cache } from './Cache.js';
import { Loader } from './Loader.js';
import { FileLoader } from './FileLoader.js';
import { createElementNS } from '../utils.js';

/**
 * A loader for loading images. The class loads images with the HTML `Image` API.
 *
 * ```js
 * const loader = new THREE.ImageLoader();
 * const image = await loader.loadAsync( 'image.png' );
 * ```
 * Please note that `ImageLoader` has dropped support for progress
 * events in `r84`. For an `ImageLoader` that supports progress events, see
 * [this thread]{@link https://github.com/mrdoob/three.js/issues/10439#issuecomment-275785639}.
 *
 * @augments Loader
 */
class ImageLoader extends Loader {

	/**
	 * Constructs a new image loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

	}

	/**
	 * Starts loading from the given URL and passes the loaded image
	 * to the `onLoad()` callback. The method also returns a new `Image` object which can
	 * directly be used for texture creation. If you do it this way, the texture
	 * may pop up in your scene once the respective loading process is finished.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(Image)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Unsupported in this loader.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 * @return {Image} The image.
	 */
	load( url, onLoad, onProgress, onError ) {

		const origUrl = url;

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		const image = createElementNS( 'img' );

		function onImageLoad() {

			removeEventListeners();

			Cache.add( url, this );

			if ( onLoad ) onLoad( this );

			scope.manager.itemEnd( url );

		}

		function onImageError( event ) {

			removeEventListeners();

			if ( onError ) onError( event );

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		}

		function removeEventListeners() {

			image.removeEventListener( 'load', onImageLoad, false );
			image.removeEventListener( 'error', onImageError, false );

		}

		image.addEventListener( 'load', onImageLoad, false );
		image.addEventListener( 'error', onImageError, false );

		if ( url.slice( 0, 5 ) !== 'data:' ) {

			if ( this.crossOrigin !== undefined ) image.crossOrigin = this.crossOrigin;

		}

		scope.manager.itemStart( url );

		Cache.get( url, 'blob' ).then( ( cachedBlob )=>{

			if ( cachedBlob !== undefined && ! cachedBlob.type.startsWith( 'text/plain' ) ) {

				if ( ! cachedBlob.type )
					if ( url.endsWith( '.svg' ) || url.startsWith( 'data:image/svg' ) )
						cachedBlob = new Blob( [ cachedBlob ], { type: 'image/svg+xml' } ); // hack for now. todo: blob SHOULD have the type from the content type in the response header or the mime type in the file name

				image.src = URL.createObjectURL( cachedBlob );
				return;

			}

			const fileLoader = new FileLoader( this.manager );
			fileLoader.useCache = false;
			fileLoader.setPath( this.path );
			fileLoader.setCrossOrigin( this.crossOrigin );
			fileLoader.setResponseType( 'blob' );

			fileLoader.load( origUrl, function ( blob ) {

				if ( ! blob.type )
					if ( url.endsWith( '.svg' ) || url.startsWith( 'data:image/svg' ) )
						blob = new Blob( [ blob ], { type: 'image/svg+xml' } ); // hack for now. todo: blob SHOULD have the type from the content type in the response header or the mime type in the file name // https://github.com/whatwg/fetch/issues/540

				Cache.add( url, blob, 'blob' );
				image.src = URL.createObjectURL( blob );

			}, onProgress, ( event )=>{

				removeEventListeners();
				if ( onError ) onError( event );

			} );

		} ).catch( ( error )=>{

			// a failing cache lookup (CacheStorage unavailable, quota, corrupted entry) must not leave the load pending forever
			removeEventListeners();
			if ( onError ) onError( error );
			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		} );

		return image;

	}

}


export { ImageLoader };
