# Ctrl+Dでログアウトしてしまうことを防ぐ
setopt IGNOREEOF

# 日本語を使用
export LANG=ja_JP.UTF-8

# コマンド履歴の設定
export HISTSIZE=1000000
export SAVEHIST=1000000

# 複数タブ / 複数ウィンドウでコマンド履歴を共有
setopt share_history

# 前と重複する行は記録しない
setopt HIST_IGNORE_DUPS
# 履歴中の重複行をファイル記録前に無くす
setopt HIST_IGNORE_ALL_DUPS
# 行頭がスペースのコマンドは記録しない
setopt HIST_IGNORE_SPACE
# 余分な空白は詰めて記録
setopt HIST_REDUCE_BLANKS

###### プロンプトの設定
autoload -Uz promptinit
promptinit

# git-promptの読み込み
source ~/dotfiles/zsh/git-prompt.sh

# git-completionの読み込み
fpath=(~/dotfiles/zsh $fpath)
zstyle ':completion:*:*:git:*' script ~/dotfiles/zsh/git-completion.bash
autoload -Uz compinit
compinit

# プロンプトのオプション表示設定
GIT_PS1_SHOWDIRTYSTATE=true
GIT_PS1_SHOWUNTRACKEDFILES=true
GIT_PS1_SHOWUPSTREAM=auto

# プロンプトの表示設定
NEWLINE=$'\n'
setopt PROMPT_SUBST ; PS1='%F{cyan}%~%f %F{green}$(__git_ps1)%f${NEWLINE}$ '

### -------------- ### 

# fzfの設定
[ -f ~/dotfiles/zsh/fzf/.fzf.zsh ] && source ~/dotfiles/zsh/fzf/.fzf.zsh
export FZF_DEFAULT_COMMAND='rg --files --hidden --glob "!.git"'
export FZF_CTRL_T_COMMAND='rg --files --hidden --glob "!.git"'
export FZF_DEFAULT_OPTS='--height 40% --reverse --border'

# fzf-cdの読み込み
source ~/dotfiles/zsh/fzf/fzf-cd.zsh

# sheldonの有効化
eval "$(sheldon source)"

# Vimコマンドのエイリアス
alias vi="nvim"
alias vim="nvim"
alias view="nvim -R"


# nvmの読み込み（idouディレクトリのみ）
# 読み込ませるためにはターミナルの再起動が必要
if [[ $(pwd) == */idou* ]]; then
  source $(brew --prefix nvm)/nvm.sh
  if [ -f "$HOME/.nvm_auto_load.zsh" ]; then
    source "$HOME/.nvm_auto_load.zsh"
  fi
fi
