filetype plugin on

" PLUGIN SETTINGS
call plug#begin('~/.config/nvim/plugged')

Plug 'tpope/vim-surround'
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'
Plug 'neoclide/coc.nvim', {'branch': 'release'}

call plug#end()

" ノーマルモードでマウス操作
:set mouse=n

" 上下の移動
cnoremap <C-p> <Up>
cnoremap <C-n> <Down>

" バッファの移動
nnoremap <silent> [b :bprevious<CR>
nnoremap <silent> ]b :bnext<CR>
nnoremap <silent> [B :bfirst<CR>
nnoremap <silent> ]B :blast<CR>

" アクティブアクティブなファイルが含まれているディレクトリを手早く展開
cnoremap <expr> %% getcmdtype() == ':' ? expand('%:h').'/' : '%%'

" pathの設定
:set path+=app/**

set number             "行番号を表示
set autoindent         "改行時に自動でインデントする
set tabstop=2          "タブを何文字の空白に変換するか
set shiftwidth=2       "自動インデント時に入力する空白の数
set expandtab          "タブ入力を空白に変換
set clipboard=unnamed  "yank した文字列をクリップボードにコピー

" 対となるキーワード間の移動
set nocompatible
runtime macros/matchit.vim

" fzfの設定
let $FZF_DEFAULT_COMMAND="rg --files --hidden --glob '!.git/**'"
let mapleader = "\<Space>"
noremap <silent> <leader>f :Files<CR>
nnoremap <silent> <leader>g :GFiles<CR>
nnoremap <silent> <leader>G :GFiles?<CR>
nnoremap <silent> <leader>b :Buffers<CR>
nnoremap <silent> <leader>h :History<CR>

" cocの設定
set statusline^=%{coc#status()}%{get(b:,'coc_current_function','')}
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gy <Plug>(coc-type-definition)
nmap <silent> gi <Plug>(coc-implementation)
nmap <silent> gr <Plug>(coc-references)

" 常にインサートモードでTerminalを開く
autocmd TermOpen * startinsert

" Terminalのインサートモードからの離脱をescキーにマッピング
:tnoremap <Esc> <C-\><C-n>

" TerminalをVSCodeのように現在のウィンドウの下に開く
command! -nargs=* T split | wincmd j | resize 20 | terminal <args>
