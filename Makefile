all:
	@cp lib/liquor_minimal.js .
	@uglifyjs -o liquor.min.js liquor.js

clean:
	@rm liquor.js
	@rm liquor_minimal.min.js

.PHONY: all clean
