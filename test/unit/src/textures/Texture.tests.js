import { Texture } from '../../../../src/textures/Texture.js';

import { EventDispatcher } from '../../../../src/core/EventDispatcher.js';

export default QUnit.module( 'Textures', () => {

	QUnit.module( 'Texture', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( assert ) => {

			const object = new Texture();
			assert.strictEqual(
				object instanceof EventDispatcher, true,
				'Texture extends from EventDispatcher'
			);

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( assert ) => {

			// no params
			const object = new Texture();
			assert.ok( object, 'Can instantiate a Texture.' );
			assert.strictEqual( object.version, 0, 'An empty texture is not marked for upload.' );

			const image = { width: 1, height: 1 };
			const texture = new Texture( image );
			assert.strictEqual( texture.image, image, 'Can use an image without browser globals.' );
			assert.strictEqual( texture.version, 0, 'Other images are not automatically marked for upload.' );

		} );

		QUnit.module( 'Instancing with ImageData', ( hooks ) => {

			// ImageData is a browser global; in Node a minimal stand-in is used (as AudioContext.tests.js mocks window.AudioContext)
			if ( typeof ImageData === 'undefined' ) {

				hooks.before( function () {

					globalThis.ImageData = class ImageData {

						constructor( width, height ) {

							this.width = width;
							this.height = height;
							this.data = new Uint8ClampedArray( width * height * 4 );

						}

					};

				} );

				hooks.after( function () {

					delete globalThis.ImageData;

				} );

			}

			QUnit.test( 'marks the texture for upload', ( assert ) => {

				const image = new ImageData( 1, 1 );
				const texture = new Texture( image );
				assert.strictEqual( texture.image, image, 'The ImageData is retained.' );
				assert.strictEqual( texture.version, 1, 'ImageData textures are marked for upload.' );
				assert.strictEqual( texture.source.version, 1, 'The image source is marked for upload.' );

			} );

		} );

		// PUBLIC
		QUnit.test( 'isTexture', ( assert ) => {

			const object = new Texture();
			assert.ok(
				object.isTexture,
				'Texture.isTexture should be true'
			);

		} );

		QUnit.test( 'dispose', ( assert ) => {

			assert.expect( 0 );

			const object = new Texture();
			object.dispose();

		} );

	} );

} );
