/*eslint-disable max-len,no-empty-function*/
module.exports = {
	'components': {
		'block1': {
			'block': 'block1',
			'elems': {
				'element': {
					'mods': {
						'mod': [
							{
								'mod-val': 'mod-val',
								'styles': {
									'color': 'green'
								}
							}
						]
					},
					'styles': {
						'color': 'blue'
					}
				}
			},
			'styles': {
				'color': 'red',
				'margin': {
					'original': 'var(--x)',
					'updated': ({theme}) => `${theme.x}`,
					'updatedStringified': '({theme}) => `${theme.x}`'
				}
			}
		},
		'block2': {
			'block': 'block2',
			'children': {
				'nestingOperator': {
					'+': [
						{
							'styles': {
								'display': 'block'
							},
							'tagName': 'span'
						}
					]
				}
			},
			'pseudos': {
				':after': {
					'styles': {
						'padding-bottom': {
							'original': 'calc(var(--y) * 2)',
							'updated': ({theme}) => `calc(${theme.y} * 2)`,
							'updatedStringified': '({theme}) => `calc(${theme.y} * 2)`'
						}
					}
				}
			},
			'styles': {
				'text-align': 'center'
			}
		},
		'block3': {
			'block': 'block3',
			'children': {
				'nestingOperator': {
					'default': [
						{
							'children': {
								'nestingOperator': {
									'default': [
										{
											'children': {
												'nestingOperator': {
													'default': [
														{
															'children': {
																'nestingOperator': {
																	'default': [
																		{
																			'block': 'block3',
																			'elems': {
																				'elem': {
																					'styles': {
																						'margin-top': {
																							'original': 'calc(var(--y) + var(--z))',
																							'updated': ({theme}) => `calc(${theme.y} + ${theme.z})`,
																							'updatedStringified': '({theme}) => `calc(${theme.y} + ${theme.z})`'
																						},
																						'position': 'fixed'
																					}
																				}
																			}
																		}
																	]
																}
															},
															'tagName': 'div'
														}
													]
												}
											},
											'tagName': 'div'
										}
									]
								}
							},
							'tagName': 'div'
						}
					],
					'~': [
						{
							'styles': {
								'width': '55px'
							},
							'tagName': 'a'
						}
					]
				}
			},
			'elems': {
				'element': {
					'styles': {
						'height': '11px'
					}
				}
			},
			'mods': {
				'mod': [
					{
						'mod-val': 'mod-val1',
						'styles': {
							'background': '#fcd'
						}
					},
					{
						'mod-val': 'mod-val2',
						'pseudos': {
							':last-child': {
								'styles': {
									'background': '#fff'
								}
							}
						}
					}
				]
			}
		}
	},
	'fonts': [],
	'variables': {
		'--x': {
			'dependencies': [],
			'name': 'theme.x',
			'values': [
				{
					'media': undefined,
					'owner': {
						'block': 'theme'
					},
					'value': '1px'
				}
			]
		},
		'--y': {
			'dependencies': [],
			'name': 'theme.y',
			'values': [
				{
					'media': undefined,
					'owner': {
						'block': 'theme'
					},
					'value': '2px'
				}
			]
		},
		'--z': {
			'dependencies': [],
			'name': 'theme.z',
			'values': [
				{
					'media': undefined,
					'owner': {
						'block': 'theme'
					},
					'value': '3px'
				}
			]
		}
	}
};
