--# -path=.:present:prelude:translator
concrete ActionsFin of Actions = CratesFin ** ActionsI with
  (Syntax = SyntaxFin),
  (Extra = ExtraFin),
  (LexActions = LexActionsFin) ;
