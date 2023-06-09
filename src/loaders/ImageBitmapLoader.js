import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

class ImageBitmapLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.isImageBitmapLoader = true;

		if ( typeof createImageBitmap === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: createImageBitmap() not supported.' );

		}

		if ( typeof fetch === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: fetch() not supported.' );

		}

		this.options = { premultiplyAlpha: 'none' };

	}

	setOptions( options ) {

		this.options = options;

		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		Cache.get( url, 'blob' ).then( ( cached ) => {

			if ( cached !== undefined ) {

				scope.manager.itemStart( url );

				createImageBitmap( cached, Object.assign( scope.options, { colorSpaceConversion: 'none' } ) )
					.then( function ( imageBitmap ) {

						if ( onLoad ) onLoad( imageBitmap );

						scope.manager.itemEnd( url );

					} )
					.catch( function ( e ) {

						if ( onError ) onError( e );

						scope.manager.itemError( url );
						scope.manager.itemEnd( url );

					} );

				return;

			}

			const fetchOptions = {};
			fetchOptions.credentials = ( this.crossOrigin === 'anonymous' ) ? 'same-origin' : 'include';
			fetchOptions.headers = this.requestHeader;

			fetch( url, fetchOptions ).then( function ( res ) {

				return res.blob();

			} ).then( function ( blob ) {

				Cache.add( url, blob, 'blob' );

				return createImageBitmap( blob, Object.assign( scope.options, { colorSpaceConversion: 'none' } ) );

			} ).then( function ( imageBitmap ) {

				if ( onLoad ) onLoad( imageBitmap );

				scope.manager.itemEnd( url );

			} ).catch( function ( e ) {

				if ( onError ) onError( e );

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			} );

			scope.manager.itemStart( url );

		} );


	}

}

export { ImageBitmapLoader };
