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

			QUnit.test( 'idle updates leave the camera position exactly as set', ( assert ) => {

				// [3, 2, 7] read back as [3, 1.9999999999999996, 7.000000000000001] after one update through spherical coordinates
				const camera = new PerspectiveCamera();
				camera.position.set( 3, 2, 7 );
				const controls = new OrbitControls( camera );
				camera.position.set( 3, 2, 7 );
				controls.target.set( 0, 0, 0 );

				for ( const damping of [ false, true ] ) {

					controls.enableDamping = damping;
					for ( let i = 0; i < 10; i ++ ) controls.update();
					assert.deepEqual( camera.position.toArray(), [ 3, 2, 7 ], `position is unchanged with damping=${ damping }` );
					assert.deepEqual( controls.target.toArray(), [ 0, 0, 0 ], `target is unchanged with damping=${ damping }` );

				}

			} );

			QUnit.test( 'limits still apply on an idle update', ( assert ) => {

				const camera = new PerspectiveCamera();
				camera.position.set( 0, 0, 10 );
				const controls = new OrbitControls( camera );
				controls.enableDamping = false;
				controls.autoPullTarget = false; // on, it moves the target instead of clamping the distance
				controls.maxDistance = 5;
				controls.update();
				assert.ok( Math.abs( controls.getDistance() - 5 ) < 1e-12, 'distance is clamped to maxDistance' );

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
