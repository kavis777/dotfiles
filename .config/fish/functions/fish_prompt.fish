set -l icon_cross \u274c
set icon_miss $icon_cross

set color_git_status_bar

function _prompt_dir
    printf ' %s ' (echo $PWD)
end

function _change_color_git_status_bar
    if [ (_is_git_dirty) ]; set color_git_status_bar $color_git_dirty
    else; set color_git_status_bar $color_git_main; end
end
 
function _is_git_dirty
    echo (command git status -s --ignore-submodules=dirty 2> /dev/null)
end
 
function _prompt_git
    if command git rev-parse --is-inside-work-tree >/dev/null 2>&1
        set -l git_branch (command git symbolic-ref HEAD 2> /dev/null | sed -e 's|^refs/heads/||')
        _change_color_git_status_bar
        # set_color -b $color_git_status_bar
        printf '%s ' (set_color $color_git_status_bar) $git_branch
    end
end


function fish_prompt
    set -l last_status $status
    if [ $last_status -gt 0 ]
        echo -n " $icon_miss "
    end

    _prompt_dir
    _prompt_git
    printf '%b' (set_color $white) '\n > '
end
