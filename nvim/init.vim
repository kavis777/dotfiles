" タブの入力の際にスペース
set expandtab

" クリップボードへの登録
set clipboard=unnamed

call plug#begin()
  Plug 'preservim/nerdtree'
  Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
  Plug 'neoclide/coc.nvim', {'branch': 'release'}
call plug#end()

" キーマッピング
"nnoremap <C-v> :NERDTreeToggle<CR>

" 自動改行しないように設定
set textwidth=0
