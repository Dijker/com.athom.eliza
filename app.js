'use strict';

const Homey = require('homey');
const Eliza = require( 'eliza-as-promised');
var eliza = new Eliza();
var speechSession = null;
var responseU = null;
var responseE = null;

class ElizaApp extends Homey.App {
	queryUser ( responseE ) {
		responseU  = speechSession.ask( responseE , {session: speechSession, timeout: 30000})
			.then (( responseU ) => {
				if ( responseU.length > 0 ) {
					this.log('L >> ' + responseU.length );
					this.log('User >> ' + responseU );
					responseE = eliza.getResponse(responseU)
					// console.log('>>re ' + responseE.reply);
						.then((responseE) => {
							if (responseE.reply) {
								this.log('Eliza >> ' + responseE.reply);
								this.queryUser( responseE.reply )
							}
							if (responseE.final) {
								this.log('Final Response from Eliza >> ' + responseE.final );
								speechSession.say( responseE.final );
								// process.exit(0);
							}
					})
					.catch((err) => {
						//reject(err);
						this.log( '>> No Response from Eliza !!' );
					})
			}
		})
		.catch((err) => {
			// reject(err);
			this.log( '>> Ask timed out !!' );
		})
	};

	/**
	 * Initializes the application.
	 */
	onInit() {
		this.log('Eliza is running...');
		this.log('Can I Speak Eliza?');
		this.log('I feel  lonely.');
		Homey.ManagerSpeechInput.on('speechEval', (speech, callback) => {
				callback(null, true);
			});
		Homey.ManagerSpeechInput.on('speechMatch', (speech, onSpeechEvalData) => {
			this.log('Eliza speechMatch ...');
			//var elizan = new Elizan();
			// start an Eliza conversation
			responseU =  null;
			responseE =  eliza.getInitial();
			this.log('New Session >> ' + responseE );
			speechSession = speech;
			this.queryUser( responseE );
			// console.log('<<< ' + responseU );
		})
	}
}

module.exports = ElizaApp;
// Can I Speak Eliza?
// I am lonely
