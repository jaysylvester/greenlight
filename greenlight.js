/*

Name:				greenlight
Type:				jQuery plugin
Author:			Jay Sylvester
Date Created:	15-Nov-2010
Last Modified:	06-Jun-2013

Purpose:			Performs form field validation.

Requirements:	All inputs must have a valid ID. A list of IDs is returned when fields
					fail validation.
					
					Required form inputs must have one of the following to be validated:
					
					1. REQUIRED attribute (short or long form)
					2. Class of "required" on the input
					3. Class of "required" on the input's parent
					
					
					Data validation is based upon the input's PATTERN attribute first, followed
					by the TYPE attribute if PATTERN isn't specified. ASCII 0-255 is assumed
					when no TYPE is present or TYPE is "text".
					
						<input id="phone-field" name="phone" type="tel" value="" required />
					
					
					Additional validation is provided based on the following:
					
						1.	Credit cards can be validated based on the LUHN algorithm by placing
							a class of "credit-card-number" on the input.
							
							<input id="cc-number" name="cc-number" class="credit-card-number" value="" required />
					
					
					To validate matching fields (e-mail confirmation, for example), one of the
					fields must have a custom attribute of DATA-MATCH-FIELD containing the ID
					of the matching field.
					
						<input id="email" name="email" type="email" value="" required />
						<input id="email-confirm" name="email-confirm" type="email" value="" data-match-field="email" required />

					
					Usage examples:

						You can validate an entire form on submit, prevent submission on failure,
						and add markup to flag and show errors. If you want to stop
						the form from submitting if there's an error, you must pass both the
						event (e) and the stopOnFail option.
						
						$('form').on('submit.validate', function(e) {
							$(this).greenlight({
								e : e,
								stopOnFail : true,
								listFields : true,
								returnType : 'html'
							});
						});
		
		
						You can also validate a single field and return feedback data only.
					
						var emailValidation = $('#email-field').greenlight();
						if ( emailValidation.success ) {
							*** do a jig ***
						};

*/

( function ($) {

	$.fn.greenlight = function (options) {
		
		var $toValidate = $(this),

			settings = {
				method: 'init',
				returnType: 'data',
				appendMessagingTo: $(this),
				requiredMessage: 'At least one required field is missing. Please make sure you\'ve filled out every field.',
				formatMessage: '[format message goes here]',
				matchMessage: '[mismatch message goes here]',
				listFields: false,
				stopOnFail: false
			},
			
			feedback = {
				success: true,
				status: 'valid',
				errorFields: {}
			},
			
			methods = {
			
				init: function () {
					if (options) {
						$.extend(settings, options);
					}
 
					if ( !$toValidate.is('input') ) {
						$toValidate = $toValidate.find('input:not([type="hidden"],[type="submit"],[type="reset"]), select, textarea');
					}
					if ( settings.method === 'init' ) {
						methods.required();
						if ( feedback.success ) {
							methods.format();
							if ( feedback.success ) {
								methods.match();
								if ( feedback.success ) {
									methods.cleanup();
								}
							}
						}
					} else {
						methods[settings.method].call();
					}
				},
				
				required: function () {
					$toValidate.each( function (index) {
						var thisInput = $(this);
						if (
								(	// [required=""] is a semi-hack to get around issues with recognizing [required] in IE6/IE7
									thisInput.is('[required=""]') ||
									thisInput.is('[required="required"]') ||
									thisInput.is('.required') ||
									thisInput.parent().is('.required')
								)
								&&
								(
									( !thisInput.is('[type="checkbox"]') && !thisInput.val() )
									||
									( thisInput.is('[type="checkbox"]') && !thisInput.is(":checked") )
								)
							) {
							feedback.success = false;
							feedback.status = 'missingRequiredFields';
							feedback.errorFields[index] = {
								id: thisInput.attr('id')
							};
						}
					});
					if ( !feedback.success ) {
						methods.fail();
					}
				},
				
				format: function () {
					$toValidate.each( function (index) {
						var thisInput = $(this),
							thisRegex,
							thisId = thisInput.attr('id'),
							/*
								jQuery has a bug that prevents .attr() from working with HTML5
								attributes not directly supported by the browser
							*/
							thisPattern = document.getElementById(thisId).getAttribute('pattern'),
							thisType = document.getElementById(thisId).getAttribute('type'),
							thisValue = thisInput.val();
						if ( !thisInput.is('select, textarea, [type="checkbox"], [type="radio"],[type="file"]') && thisValue ) {
							if ( thisPattern === undefined || thisPattern === null || !thisPattern.length ) {
								switch (thisType) {
									case 'email':
										thisPattern = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
										break;
									case 'number':
										thisPattern = /\b\d+\b/;
										break;
									case 'password':
										thisPattern = /^[\u0000-\u007F]+$/;
										break;
									case 'tel':
										/* strip non-digits */ 
										var stripPhoneNumber = thisValue.replace(/[^0-9]/g, '');
										thisValue = stripPhoneNumber;
										thisInput.val(thisValue);
										
										thisPattern = /^\d{10,25}$/;
										break;
									default:
										thisPattern = /^[\u0000-\u00FF]+$/;
										break;
								}
							}
							thisRegex = new RegExp(thisPattern);
							if ( !thisRegex.test(thisValue) ) {
								feedback.success = false;
								feedback.status = 'invalid';
								feedback.errorFields[index] = {
									id: thisId
								};
							}
						}
						if ( thisInput.is('.credit-card-number') ) {
							new function () {
								var cardNumber = thisValue.replace(/\D/g, ''),
									total = 0;
								for ( var i = 0; i < cardNumber.length; i++ ) {
									var digit = cardNumber.charAt(i);
									if ( i % 2 == (cardNumber.length % 2) ) {
										digit *= 2;
										if ( digit > 9 ) {
											digit -= 9;
										}
									}
									total += parseInt(digit);
								}
								if ( total % 10 ) {
									feedback.success = false;
									feedback.status = 'invalid';
									feedback.errorFields[i] = {
										id: thisId
									};
									i++;
								}
							}
						}
					});
					if ( !feedback.success ) {
						methods.fail();
					}
				},
				
				match: function () {
					$toValidate.each( function (index) {
						var thisInput = $(this),
							thisMatch = $('#' + thisInput.attr('data-match-field'));
						if ( thisMatch && thisMatch.length && thisInput.val() !== thisMatch.val() ) {
							feedback.success = false;
							feedback.status = 'mismatch';
							feedback.errorFields[index] = {
								id: thisInput.attr('id'),
								matchId: thisMatch.attr('id')
							};
						}
					});
					if ( !feedback.success ) {
						methods.fail();
					}
				},
				
				fail: function () {
					if ( settings.stopOnFail ) {
						options.e.preventDefault();
					}
					if ( settings.returnType === 'html' ) {
						methods.cleanup('fields');
						methods.markup({
							status: feedback.status,
							fields: feedback.errorFields
						});
					}
				},
				
				markup: function (params) {
					if ( !$(settings.appendMessagingTo).find('div.validate').length ) {
						$(settings.appendMessagingTo).append('<div class="validate"><p class="message"></p></div>');
					}
					switch ( params.status ) {
						case 'missingRequiredFields':
							$.each(params.fields, function (key, value) {
								$('#' + value.id).parent().addClass('validate-failed validate-error-required');
							});
							$(settings.appendMessagingTo).find('div.validate').addClass('failed required-fields').find('p.message').html(settings.requiredMessage);
							break;
						case 'invalid':
							$.each(params.fields, function (key, value) {
								$('#' + value.id).parent().addClass('validate-failed validate-error-invalid');
							});
							$(settings.appendMessagingTo).find('div.validate').addClass('failed format').find('p.message').html(settings.formatMessage);
							break;
						case 'mismatch':
							$.each(params.fields, function (key, value) {
								$('#' + value.id).parent().addClass('validate-failed validate-error-match');
								$('#' + value.matchId).parent().addClass('validate-failed validate-error-match');
							});
							$(settings.appendMessagingTo).find('div.validate').addClass('failed match').find('p.message').html(settings.matchMessage);
							break;
					}
					if ( settings.listFields ) {
						$(settings.appendMessagingTo).find('div.validate').append('<ul class="error-fields"></ul>');
						switch ( params.status ) {
							case 'mismatch':
								$.each(params.fields, function (key, value) {
									var label = $('label[for="' + value.id + '"]'),
										matchLabel = $('label[for="' + value.matchId + '"]');
									$(settings.appendMessagingTo).find('div.validate ul.error-fields').append('<li>' + label.text() + '/' + matchLabel.text() + '</li>');
								});
								break;
							default:
								$.each(params.fields, function (key, value) {
									var label = $('label[for="' + value.id + '"]');
									$(settings.appendMessagingTo).find('div.validate ul.error-fields').append('<li>' + label.text() + '</li>');
								});
								break;
						}
					}
				},
				
				cleanup: function (scope) {
					if ( typeof scope === 'undefined' ) {
						scope = 'all';
					}
					switch ( scope ) {
						case 'all':
							$(settings.appendMessagingTo).find('div.validate').remove();
							break;
						case 'fields':
							$(settings.appendMessagingTo).find('div.validate ul').remove();
							break;
					}
					$toValidate.each( function () {
						$(this).parent().removeClass('validate-failed validate-error-required');
						$(this).parent().removeClass('validate-failed validate-error-invalid');
						$(this).parent().removeClass('validate-failed validate-error-match');
					});
				}
			};
		
		methods.init();
		return feedback;

	};

})(jQuery);