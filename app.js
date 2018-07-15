'use strict';
const debug = true;
const askTimeout = 15*1000; //90  Seconds
const Homey = require('homey');
const Eliza = require( 'eliza-as-promised');
var eliza = new Eliza();
var speechSession = null;
var responseU = null;
var responseE = null;


class ElizaApp extends Homey.App {
	async queryUser ( responseE ) {
		responseU  = speechSession.ask( responseE , {session: speechSession, timeout: askTimeout})
			.then (( responseU ) => {
				if ( responseU.length > 0 ) {
					if (debug) { this.log( 'User >> ' + responseU )}
					responseE = eliza.getResponse(responseU)
					// console.log('>>re ' + responseE.reply);
						.then((responseE) => {
							if (responseE.reply) {
								if (debug) { this.log( 'Eliza >> ' + responseE.reply)}
								this.queryUser( responseE.reply )
							}
							if (responseE.final) {
								if (debug) { this.log( 'Final Response from Eliza >> ' + responseE.final )}
								speechSession.say( responseE.final );
								// process.exit(0);
							}
					})
					.catch((err) => {
						//reject(err);
						if (debug) { this.log(  '>> No Response from Eliza !!' ) }
					})
			}
		})
		.catch((err) => {
			// reject(err);
			speechSession.say('Time is over now, ');
			responseE = eliza.getResponse("bye")
				.then((responseE) => {
					speechSession.say( responseE.final )
				})
				.catch((err) => {
					// reject(err);
					if (debug) { this.log(  '>> End timed out !!' )}
				})
			if (debug) { this.log(  '>> Ask timed out !!' )}
		})
	};

	/**
	 * Initializes the application.
	 */
	onInit() {
		this.log('Eliza is running...');
		this.log('Debug:', debug );
		Homey.ManagerSpeechInput.on('speechEval', (speech, callback) => {
				callback(null, true);
			});
		Homey.ManagerSpeechInput.on('speechMatch', (speech, onSpeechEvalData) => {
			this.log('Eliza speechMatch ...');
			//var elizan = new Elizan();
			// start an Eliza conversation
			responseU =  null;
			responseE =  eliza.getInitial();
			if (debug) { this.log('New Session >> ' + responseE )}
			speechSession = speech;
			speechSession.say('Hi, I m Eliza your therapist, ');
			responseU = this.queryUser( responseE )
				.then((responseU) => {
					this.log('<<< then Returned' );
				})
				.catch((responseU) => {
					this.log('<<< catch Returned' );
				})
		})
	}
}

module.exports = ElizaApp;
