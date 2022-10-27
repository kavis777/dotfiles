# Ctrl+Dでログアウトしてしまうことを防ぐ
setopt IGNOREEOF

# 日本語を使用
export LANG=ja_JP.UTF-8

# 複数タブ / 複数ウィンドウでコマンド履歴を共有
setopt share_history

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

# ghq-fzfの読み込み
source ~/dotfiles/zsh/fzf/ghq-fzf.zsh

# プロンプトのオプション表示設定
GIT_PS1_SHOWDIRTYSTATE=true
GIT_PS1_SHOWUNTRACKEDFILES=true
GIT_PS1_SHOWUPSTREAM=auto

# プロンプトの表示設定
NEWLINE=$'\n'
setopt PROMPT_SUBST ; PS1='%F{cyan}%~%f %F{green}$(__git_ps1)%f${NEWLINE}$ '

### -------------- ### 

# プラグイン有効化
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source $(brew --prefix)/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# fzfの設定
[ -f ~/dotfiles/zsh/fzf/.fzf.zsh ] && source ~/dotfiles/zsh/fzf/.fzf.zsh
export FZF_DEFAULT_COMMAND='rg --files --hidden --glob "!.git"'
export FZF_CTRL_T_COMMAND='rg --files --hidden --glob "!.git"'
export FZF_DEFAULT_OPTS='--height 40% --reverse --border'

# asdfの有効化
. $(brew --prefix asdf)/libexec/asdf.sh
