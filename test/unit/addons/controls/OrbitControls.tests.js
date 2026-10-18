import { PerspectiveCamera } from '../../../../src/cameras/PerspectiveCamera.js';
import { OrbitControls } from '../../../../examples/jsm/controls/OrbitControls.js';

export default QUnit.module( 'Addons', () => {

	QUnit.module( 'Controls', () => {

		QUnit.module( 'OrbitControls', () => {

			QUnit.test( 'construction and idle updates preserve camera distance', ( assert ) => {

				const camera = new PerspectiveCamera();
				camera.position.set( 0, 0, 10 );
				const controls = new OrbitControls( camera );
				assert.strictEqual( controls.getDistance(), 10, 'construction does not dolly the camera' );

				let changes = 0;
				controls.addEventListener( 'change', () => changes ++ );

				for ( const damping of [ false, true ] ) {

					controls.enableDamping = damping;
					for ( let i = 0; i < 10; i ++ ) controls.update();
					assert.strictEqual( controls.getDistance(), 10, `idle updates preserve distance with damping=${ damping }` );
					assert.strictEqual( camera.zoom, 1, 'idle updates preserve zoom' );

				}

				assert.strictEqual( changes, 0, 'idle updates emit no change events' );

			} );

			for ( const [ method, expectedDistance ] of [[ 'zoomIn', 9 ], [ 'zoomOut', 11 ]] ) {

				QUnit.test( `${ method } without damping`, ( assert ) => {

					const camera = new PerspectiveCamera();
					camera.position.set( 0, 0, 10 );
					const controls = new OrbitControls( camera );
					controls.enableDamping = false;

					// Isolate zoom from construction, which is tested above.
					camera.position.set( 0, 0, 10 );
					controls.update();
					controls[ method ]( 0.1 );
					controls.update();
					assert.strictEqual( controls.getDistance(), expectedDistance, 'applies the requested dolly' );
					assert.strictEqual( camera.zoom, 1, 'perspective dolly preserves zoom' );

					for ( let i = 0; i < 10; i ++ ) controls.update();
					assert.strictEqual( controls.getDistance(), expectedDistance, 'no residual dolly without damping' );

				} );

			}

		} );

	} );

} );
