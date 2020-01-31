ts-gen:
	GENERATOR=typescript-fetch
	docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate -i /local/scripts/openapi.json -g ${GENERATOR} -o /local/ui/gen
