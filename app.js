'use strict';
var debug = false;
const askTimeout = 75*1000; //90  Seconds
const Homey = require('homey');
const Eliza = require( 'eliza-as-promised');
var eliza = new Eliza();
// var speechSession = null;
var responseU = null;
var responseE = null;


class ElizaApp extends Homey.App {
	async queryUser ( ElizaSession, responseE ) {
		responseU  = ElizaSession.speech.ask( responseE , {session: ElizaSession.speech, timeout: askTimeout})
			.then(( responseU ) => {
				if ( responseU.length > 0 ) {
					if (debug) { this.log( 'User >> ' + responseU )}
					responseE = eliza.getResponse(responseU)
					// console.log('>>re ' + responseE.reply);
						.then((responseE) => {
							if (responseE.reply) {
								if (debug) { this.log( 'Eliza >> ' + ElizaSession.missed + responseE.reply)}
								if (ElizaSession.missed > 0) { ElizaSession.missed -=1;}
								this.queryUser( ElizaSession, responseE.reply )
							}
							if (responseE.final) {
								ElizaSession.final = true;
								if (debug) { this.log( 'Final Response from Eliza >> ' + responseE.final )}
									ElizaSession.speech.say( responseE.final );
							}
					})
					.catch((err) => { // this should not happen
						if (debug) { this.log(  '>> No Response from Eliza !!' ) }
					})
			}
			})
			.catch((err) => { //ask timeout
				ElizaSession.missed +=1;
				if (ElizaSession.missed > 3) {
					ElizaSession.final = true;
					if (debug) { this.log(  '>> Ask timed out !! Missed: ' + ElizaSession.missed  )}
					ElizaSession.speech.say('Time is over now, ');
					responseE = eliza.getResponse("bye")
					.then((responseE) => {
						ElizaSession.speech.say( responseE.final )
					})
					.catch((err) => {
						if (debug) { this.log(  '>> End timed out !!' )}
					})
				} else {
					responseE = eliza.getResponse(" ")
					.then((responseE) => {
						this.queryUser( ElizaSession, responseE.reply )
					}).catch((responseE) => {})
				}
				if (debug) { this.log(  '>> Ask timed out !!  Missed: '+ ElizaSession.missed )}
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
			this.log('Eliza speechMatch ...', speech);
			if (speech.matches && speech.matches.main && speech.matches.main.debug) {
				debug = true;
				this.log('!! Set debug is True!')
			}
			// start an Eliza conversation
			responseU =  null;
			responseE =  eliza.getInitial(debug);
			if (debug) { this.log('New Session >> ' + responseE )};
			var ElizaSession = {};
			ElizaSession.speech = speech;
			ElizaSession.missed = 0;
			ElizaSession.final = false;
			if (speech.matches && speech.matches.main && speech.matches.main.Eliza) {
				ElizaSession.speech.say('Hi, I am Eliza,, your therapist, ')
				.then(() => {
					this.log('<<< then matches main Eliza' );
					responseU = this.queryUser( ElizaSession, responseE )
					.then((responseU) => {
						this.log('<<< then Returned' );
					}).catch(() => {})
				}).catch(() => {})
			} else {
				this.log('<<< else matches main mood ', speech.transcript  );
				responseE = eliza.getResponse( speech.transcript )
					.then((responseE) => {
						this.log('<<< 1st getResponse Returned' , responseE.reply );
						responseU = this.queryUser( ElizaSession, responseE.reply )
							.then(() => { })
							.catch(() => { })
					})
				.catch(() => {	})
			}
		})
	}
}

module.exports = ElizaApp;
