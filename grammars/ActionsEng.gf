--# -path=.:present:prelude:translator
concrete ActionsEng of Actions = CratesEng ** ActionsI with
  (Syntax = SyntaxEng),
  (Extra = ExtraEng),
  (LexActions = LexActionsEng) ;
