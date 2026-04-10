#
# fzf-cd.zsh
#
# ABOUT:
#   `cd` to `ghq` repositories directory on `zsh`
#   You can launch this function with `Ctrl-g`
#
# INSTALLATION:
#   Requires `zsh` and `fzf`
#   Download this file then, append `source path/to/fzf-ghq.zsh` to your `~/.zshrc`
#   or copy & paste to your `~/.zshrc`
# 

function _fzf_cd() {
    local ghq_repos="$(ghq list --full-path)"
    local home_repos="$(find $HOME -maxdepth 1 -type d -exec test -d {}/.git \; -print 2>/dev/null | while read dir; do
        git -C "$dir" remote -v 2>/dev/null | grep -q github.com && echo "$dir"
    done)"
    local destination="$(echo "${ghq_repos}\n${home_repos}" | sort -u | fzf --delimiter='/' --with-nth=-1)"
    [ -n "${destination}" ] && cd "${destination}"
    zle accept-line
    zle reset-prompt
}

zle -N _fzf_cd
bindkey "^g" _fzf_cd

