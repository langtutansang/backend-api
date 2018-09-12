## run project
  yarn dev || npm dev
  node .
  yarn start || npm start

## Link
	Link client: http://localhost:4000
	link docs api: http://localhost:4000/docsapi
	link api: http://localhost:4000/api/v1/(*)

## conllection mail
	### Method Send mail
		body
			to 		: {type: email, min:7, max: 200},//
	    	subject	: {type: email, min:3, max: 200},//
	    	text 		: {type: string},//
	    	html 		: {type: string},//
	    return Onject

## conllection user
	### method forgotPassword
		body
			email 		: {type: email, min:7, max: 200}, //
	    return Onject

	### method checkToken
		body
			token 		: {type: string, min:86, max: 86},
	    return Onject
	### method resetPassWord
		body
			id 			: {type: string, min:24, max: 24},
			token 		: {type: string, min:32, max: 32},
			password 	: {type: string, min:6, max: 32},