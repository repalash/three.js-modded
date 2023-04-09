import { Cache } from './Cache.js';
import { Loader } from './Loader.js';
import { FileLoader } from './FileLoader.js';
import { createElementNS } from '../utils.js';

class ImageLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onError ) {

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
			fileLoader.setResponseType( 'blob' );

			fileLoader.load( url, function ( blob ) {

				if ( ! blob.type )
					if ( url.endsWith( '.svg' ) || url.startsWith( 'data:image/svg' ) )
						blob = new Blob( [ blob ], { type: 'image/svg+xml' } ); // hack for now. todo: blob SHOULD have the type from the content type in the response header or the mime type in the file name // https://github.com/whatwg/fetch/issues/540

				Cache.add( url, blob, 'blob' );
				image.src = URL.createObjectURL( blob );

			}, onProgress, ( event )=>{

				removeEventListeners();
				if ( onError ) onError( event );

			} );

		} );

		return image;

	}

}


export { ImageLoader };
