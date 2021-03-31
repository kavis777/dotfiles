filetype plugin on

" PLUGIN SETTINGS
call plug#begin('~/.config/nvim/plugged')

" 囲い（surround）を編集する際に役立つプラグイン
Plug 'tpope/vim-surround'

" あいまい検索ができるプラグイン
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'

" Language Server Protocol
" プログラムのプロジェクト ソースを解析して情報を提供するプラグイン
Plug 'neoclide/coc.nvim', {'branch': 'release'}

" TypeScriptのためのシンタックスハイライト
Plug 'HerringtonDarkholme/yats.vim'

" JSX/TSXのためのシンタックスハイライト
Plug 'maxmellon/vim-jsx-pretty'

" テーマカラー設定
Plug 'morhetz/gruvbox'

" Gitの追加/削除/変更された行を行番号の左に表示
Plug 'airblade/vim-gitgutter'

" ステータスバーをいい感じにカスタマイズできるプラグイン
Plug 'vim-airline/vim-airline'

call plug#end()

" テーマの設定
syntax enable
set background=dark
colorscheme gruvbox

" ステータスバーの設定
let g:airline#extensions#tabline#enabled = 1
let g:airline_powerline_fonts = 1
let g:airline#extensions#tabline#left_sep = ' '
let g:airline#extensions#tabline#left_alt_sep = '|'
let g:airline#extensions#tabline#formatter = 'unique_tail'

" ノーマルモードでマウス操作
set mouse=n

" 上下の移動
cnoremap <C-p> <Up>
cnoremap <C-n> <Down>

set incsearch " インクリメンタルサーチ. １文字入力毎に検索を行う
set ignorecase " 検索パターンに大文字小文字を区別しない
set smartcase " 検索パターンに大文字を含んでいたら大文字小文字を区別する
set hlsearch " 検索結果をハイライト

" ESCキー2度押しでハイライトの切り替え
nnoremap <silent> <Esc><Esc> :noh<CR>

" バッファの移動
nnoremap <silent> [b :bprevious<CR>
nnoremap <silent> ]b :bnext<CR>
nnoremap <silent> [B :bfirst<CR>
nnoremap <silent> ]B :blast<CR>

" アクティブアクティブなファイルが含まれているディレクトリを手早く展開
cnoremap <expr> %% getcmdtype() == ':' ? expand('%:h').'/' : '%%'

set number             "行番号を表示
set autoindent         "改行時に自動でインデントする
set tabstop=2          "タブを何文字の空白に変換するか
set shiftwidth=2       "自動インデント時に入力する空白の数
set expandtab          "タブ入力を空白に変換
set clipboard=unnamed  "yank した文字列をクリップボードにコピー
set history=5000 " 保存するコマンド履歴の数

" 対となるキーワード間の移動
set nocompatible
runtime macros/matchit.vim

" fzfの設定
let $FZF_DEFAULT_COMMAND="rg --files --hidden --glob '!.git/**'"
nnoremap <silent> <Space>f :Files<CR>
nnoremap <silent> <Space>b :GFiles<CR>
nnoremap <silent> <Space>G :GFiles?<CR>
nnoremap <silent> <Space>b :Buffers<CR>
nnoremap <silent> <Space>h :history<cr>

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

" Prittierコマンドを実行
command! -nargs=0 Prettier :CocCommand prettier.formatFile

