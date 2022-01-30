const Cache = {

	enabled: false,

	files: {},

	add: function ( key, file ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Adding key:', key );

		this.files[ key ] = file;

	},

	get: function ( key, type ) {

		if ( this.enabled === false ) return type ? Promise.resolve() : undefined;

		// console.log( 'THREE.Cache', 'Checking key:', key );

		return type ? Promise.resolve( this.files[ key ] ) : this.files[ key ];

	},

	remove: function ( key ) {

		delete this.files[ key ];

	},

	clear: function () {

		this.files = {};

	}

};


export { Cache };
