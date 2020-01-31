GENERATOR=typescript-axios

ts-gen: oas-gen api-gen

api-gen:
	docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate -i /local/scripts/openapi.json -g ${GENERATOR} -o /local/ui/gen

oas-gen:
	cd scripts && node make-oas.js
