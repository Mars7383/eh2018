local http = game:GetService('HttpService')
local remote = game:GetService('ReplicatedStorage')
    :FindFirstChild('1ec51ce5-dea5-4154-beca-131781fbf37d')
local total_cards = #workspace:WaitForChild('RedCards'):GetChildren()
local order_func = require(
    game:GetService('StarterPlayer').StarterPlayerScripts.Carry.CCMN.Order
)

for x = 1, 27 do
local cards_observed = x
local offset_counts = {}
for i = 1, 10000 do
    local sum = math.random(2 * total_cards, 14 * total_cards)
    local card_values = order_func(sum, total_cards)
    local makeshift_sum = 0
    for j = 1, cards_observed do
        makeshift_sum = makeshift_sum + card_values[j]
    end
    makeshift_sum = math.round((makeshift_sum / cards_observed) * total_cards)
    local diff = sum - makeshift_sum
    if offset_counts['' .. diff] == nil then
        offset_counts['' .. diff] = 1
    else
        offset_counts['' .. diff] = offset_counts['' .. diff] + 1
    end
    -- print(i .. ". generated: " .. sum .. ", estimate: " .. makeshift_sum .. " (off by " .. diff .. ")")
    -- task.wait()
end
writefile(
    'analysis_' .. cards_observed .. '_observed.json',
    http:JSONEncode(offset_counts)
)
task.wait(1)
end
