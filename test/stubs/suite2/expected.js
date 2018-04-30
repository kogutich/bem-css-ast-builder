module.exports = {
	'components': {
		'a': {
			'block': 'a',
			'children': {
				'nestingOperator': {
					'default': [
						{
							'block': 'b',
							'children': {
								'nestingOperator': {
									'default': [
										{
											'block': 'c',
											'styles': {
												'position': 'relative'
											}
										}
									]
								}
							}
						}
					]
				}
			},
			'styles': {
				'border': '1px solid #1fe',
				'cursor': 'default',
				'white-space': 'normal'
			}
		},
		'b': {
			'block': 'b',
			'styles': {
				'white-space': 'normal'
			}
		}
	},
	'fonts': [],
	'variables': {}
};
