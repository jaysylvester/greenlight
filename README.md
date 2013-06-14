greenlight
===========

Name:				greenlight
Type:				jQuery plugin
Author:			Jay Sylvester
Date Created:	15-Nov-2010
Last Modified:	06-Jun-2013

Purpose:			Performs form field validation.

All inputs must have a valid ID. A list of IDs is returned when fields fail validation.

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