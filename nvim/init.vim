" タブの入力の際にスペース
set expandtab

" クリップボードへの登録
set clipboard=unnamed

call plug#begin()
  Plug 'preservim/nerdtree'
  Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
call plug#end()

" キーマッピング
"nnoremap <C-v> :NERDTreeToggle<CR>

