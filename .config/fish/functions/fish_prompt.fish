set -l icon_cross \u274c
set icon_miss $icon_cross

function _prompt_dir
    printf ' %s ' (echo $PWD)
end

function fish_prompt
    set -l last_status $status
    if [ $last_status -gt 0 ]
        echo -n " $icon_miss "
    end

    _prompt_dir
end
