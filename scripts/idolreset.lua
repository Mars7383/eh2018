-- simulates wookong idol egg resetting in eh2018
-- made for use with Hydrogen Mac on macOS Big Sur 11.7.10 
-- lower macOS versions may crash on keypress calls (as of July 27th, 2025)
-- by Mars7383

-- vars
local Player = game:GetService("Players").LocalPlayer
local GrabbingPosition = CFrame.new(480.2, -25.2, 212, -0.25, 0, -1, 0, 1, 0, 1, 0, -0.25)
local IdolEgg = workspace.Eggs.EggObjects["Idol Egg"].Statue
local TempleSpawnPosition = workspace.Eggs.EggObjects["Idol Egg"].IdolEggSpawnPoint.Position
local TrapdoorPosY = workspace.Eggs.EggObjects["Idol Egg"].TrapDoor.Position.Y
local ResetCharacter = game:GetService("ReplicatedStorage").NetworkRemotes.ResetCharacter

-- counters
local TempleSpawns = 0
local TotalRuns = 0

-- set up gui
if gethui():FindFirstChild("EmpiricalAnalysis") then gethui().EmpiricalAnalysis:Destroy() end
local gui = Instance.new("ScreenGui", gethui())
gui.Name = "EmpiricalAnalysis"
local label = Instance.new("TextLabel", gui)
label.RichText = true
label.Position = UDim2.new(0.05, 0, 0.2, 0)
label.Size = UDim2.new(0, 400, 0, 600)
label.BackgroundTransparency = 1
label.TextXAlignment = Enum.TextXAlignment.Left
label.TextYAlignment = Enum.TextYAlignment.Top
label.TextSize = 36
label.Font = Enum.Font.Code
label.LineHeight = 1.5

task.wait(2) -- gives you time to focus on the roblox window after executing the script

-- main loop
while task.wait() do
    Player.Character.HumanoidRootPart.CFrame = GrabbingPosition -- teleport to grabbing position
    repeat -- repeatedly press Q until the egg is grabbed
        keypress_mac(0x0c)
        task.wait()
        keyrelease_mac(0x0c)
        task.wait(0.2)
    -- we can tell that the egg was grabbed if the display model becomes transparent, 
    -- or if our character is under the trapdoor
    until IdolEgg.Transparency == 1 or (Player.Character.HumanoidRootPart.Position.Y < TrapdoorPosY and task.wait(0.2))
	-- request a character reset from the server. we will also take advantage of the yielding InvokeServer
    -- function call to measure our ping
    local StartTime = os.clock()
    ResetCharacter:InvokeServer()
    local Ping = math.floor((os.clock() - StartTime) * 1000)
    -- pause until the reset sequence is completed
    repeat task.wait(0.2) until Player.Character.Humanoid.Health > 0
    -- measure distance from the idol respawn point to determine where we spawned
    if (Player.Character.HumanoidRootPart.Position - TempleSpawnPosition).Magnitude < 10 then
        TempleSpawns = TempleSpawns + 1
    end
    TotalRuns = TotalRuns + 1

    -- update the gui
    label.Text = [[<b><font color="#ffffff"><stroke color="#000000" joins="miter" thickness="2" transparency="0.25">Idol Egg Respawn Tracker</stroke></font></b>
<font color="#98e394"><stroke color="#000000" joins="miter" thickness="2" transparency="0.25">Temple Spawns: ]] .. TempleSpawns .. [[</stroke></font>
<font color="#eba794"><stroke color="#000000" joins="miter" thickness="2" transparency="0.25">World Spawns: ]] .. (TotalRuns - TempleSpawns) .. [[</stroke></font>
<font color="#ffffff"><stroke color="#000000" joins="miter" thickness="2" transparency="0.25">Temple Chance: ]] .. string.format("%.2f", TempleSpawns/TotalRuns*100) .. [[%</stroke></font>
<font color="#ffffff"><stroke color="#000000" joins="miter" thickness="2" transparency="0.25">Ping: ]] .. Ping .. [[ ms</stroke></font>]]

    -- pause until the idol egg is ready to be grabbed again
    repeat task.wait(0.2) until IdolEgg.Transparency == 0

end
