/**************************
 * Dusan Bosnjak @pailhead
 **************************/

// add fragment varying if feature enabled

module.exports = [

"#ifdef USE_COLOR",

	"varying vec3 vColor;",

"#endif",

"#if defined( INSTANCE_COLOR )",
		
	"varying vec3 vInstanceColor;",
	"varying vec3 vInstanceColor2;",
		
"#endif"

].join("\n")