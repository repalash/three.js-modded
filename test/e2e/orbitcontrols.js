import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import express from 'express';
import puppeteer from 'puppeteer';

async function main() {

	// Exercise the public DOM event path, including trackpad and touchscreen pinch.
	// Run after build-module, just like the screenshot E2E tests.
	const app = express();
	app.use( express.static( path.resolve() ) );
	const server = app.listen( 0, '127.0.0.1' );
	await once( server, 'listening' );

	let browser;
	let failures = 0;
	let total = 0;

	try {

		browser = await puppeteer.launch( { headless: true } );
		console.log( `Browser: ${ await browser.version() }` );
		const page = await browser.newPage();
		await page.setViewport( { width: 400, height: 400, hasTouch: true } );
		const errors = [];
		page.on( 'pageerror', error => errors.push( error.message ) );
		await page.goto( `http://127.0.0.1:${ server.address().port }/test/e2e/orbitcontrols.html` );
		const client = await page.createCDPSession();

		if ( ! process.argv.includes( '--zoom-only' ) ) {

			for ( const perspective of [ true, false ] ) {

				const name = `${ perspective ? 'perspective' : 'orthographic' } construction preserves camera distance`;
				total ++;
				try {

					const result = await page.evaluate( perspective => window.setup( perspective, false, false ), perspective );
					console.log( JSON.stringify( { name, result } ) );
					assert.equal( result.distance, 10, 'construction must not dolly without input' );
					assert.equal( result.zoom, 1, 'construction preserves zoom' );
					for ( const damping of [ false, true ] ) {

						const idle = await page.evaluate( damping => {

							window.controls.enableDamping = damping;
							for ( let i = 0; i < 200; i ++ ) window.controls.update();
							return window.snapshot();

						}, damping );
						assert.equal( idle.distance, 10, 'no-input updates preserve distance' );
						assert.equal( idle.zoom, 1, 'no-input updates preserve zoom' );
						assert.equal( idle.changes, 0, 'no-input updates emit no change' );

					}

					console.log( `PASS ${ name }` );

				} catch ( error ) {

					failures ++;
					console.error( `FAIL ${ name }: ${ error.message }` );

				}

			}

		}

		for ( const perspective of [ true, false ] ) {

			for ( const damping of [ false, true ] ) {

				for ( const gesture of [ 'wheel', 'trackpad pinch', 'touchscreen pinch' ] ) {

					for ( const zoomIn of [ true, false ] ) {

						const name = `${ perspective ? 'perspective' : 'orthographic' }, damping=${ damping }, ${ gesture }, ${ zoomIn ? 'in' : 'out' }`;
						total ++;

						try {

							await page.evaluate( ( perspective, damping ) => window.setup( perspective, damping ), perspective, damping );

							if ( gesture === 'touchscreen pinch' ) {

								const points = separation => [
									{ x: 200 - separation / 2, y: 200, id: 1 },
									{ x: 200 + separation / 2, y: 200, id: 2 }
								];
								await client.send( 'Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points( 100 ) } );
								await client.send( 'Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points( zoomIn ? 120 : 80 ) } );
								await client.send( 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] } );

							} else {

								// Trackpad pinch is a Ctrl+wheel event without a physical Control keydown.
								await client.send( 'Input.dispatchMouseEvent', {
									type: 'mouseWheel', x: 200, y: 200, deltaX: 0,
									deltaY: ( zoomIn ? - 1 : 1 ) * ( gesture === 'wheel' ? 10 : 1 ),
									modifiers: gesture === 'trackpad pinch' ? 2 : 0
								} );

							}

							await page.waitForFunction( () => window.inputs > 0 );
							const first = await page.evaluate( () => window.snapshot() );
							const settled = await page.evaluate( () => {

								for ( let i = 0; i < 200; i ++ ) window.controls.update();
								return window.snapshot();

							} );
							const after = await page.evaluate( () => {

								window.controls.update();
								return window.snapshot();

							} );
							console.log( JSON.stringify( { name, first, settled } ) );
							assert.deepEqual( errors, [], 'no browser exceptions' );
							assert.ok( first.changes > 0, 'zoom emits change' );
							assert.deepEqual( first.target, [ 0, 0, 0 ], 'zoom preserves the target' );
							const initial = perspective ? 10 : 1;
							const value = perspective ? first.distance : first.zoom;
							assert.ok( Number.isFinite( value ) && value > 0, 'finite positive camera extent' );
							assert.ok( ( zoomIn === perspective ) ? value < initial : value > initial, 'zoom moves in the requested direction' );

							if ( perspective && gesture !== 'touchscreen pinch' ) {

								// A 10-pixel wheel step applies 10% immediately, or 0.5% with default damping.
								const expected = 10 + ( zoomIn ? - 1 : 1 ) * ( damping ? 0.05 : 1 );
								assert.ok( Math.abs( first.distance - expected ) < 1e-10, 'applies the expected dolly delta' );
								if ( damping ) assert.ok( zoomIn ? settled.distance < first.distance : settled.distance > first.distance, 'damping continues the dolly' );

							}

							if ( ! damping ) {

								assert.ok( Math.abs( settled.distance - first.distance ) < 1e-10, 'no residual dolly without damping' );
								assert.equal( settled.zoom, first.zoom, 'no residual zoom without damping' );

							}

							if ( perspective ) {

								assert.equal( first.zoom, 1, 'perspective dolly preserves camera zoom' );

							} else {

								assert.ok( Math.abs( first.distance - 10 ) < 1e-10, 'orthographic zoom preserves distance' );

							}

							assert.ok( Math.abs( after.distance - settled.distance ) < 1e-10, 'dolly settles' );
							assert.equal( after.zoom, settled.zoom, 'zoom settles' );
							const reset = await page.evaluate( () => {

								window.controls.reset();
								const first = window.snapshot();
								for ( let i = 0; i < 200; i ++ ) window.controls.update();
								const idle = window.snapshot();
								window.controls.reset();
								return { first, idle, repeated: window.snapshot() };

							} );
							console.log( JSON.stringify( { name, reset } ) );
							for ( const state of [ reset.first, reset.idle, reset.repeated ] ) {

								assert.ok( Math.abs( state.distance - 10 ) < 1e-10, 'reset restores the saved distance' );
								assert.equal( state.zoom, 1, 'reset restores the saved zoom' );
								assert.deepEqual( state.target, [ 0, 0, 0 ], 'reset restores the saved target' );

							}

							console.log( `PASS ${ name }` );

						} catch ( error ) {

							failures ++;
							console.error( `FAIL ${ name }: ${ error.message }` );

						}

					}

				}

			}

		}

		console.log( `OrbitControls: ${ total - failures } passed, ${ failures } failed, ${ total } total` );
		if ( failures > 0 ) process.exitCode = 1;

	} finally {

		if ( browser ) await browser.close();
		await new Promise( resolve => server.close( resolve ) );

	}

}

main().catch( error => {

	console.error( error );
	process.exitCode = 1;

} );
