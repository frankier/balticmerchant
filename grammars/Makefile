all: Crates.pgf Actions.pgf decimal.pgf

Crates.pgf:
	gf -make ActionsEng.gf ActionsFin.gf

Actions.pgf:
	gf -make ActionsEng.gf ActionsFin.gf

decimal.pgf:
	gf -make decimal.gf

clean:
	rm *.pgf *.gfo
