if _G.bridge_mutex then return script:Destroy() end
_G.bridge_mutex = true
local offset_test = 25
local YLevel = 3
local precision = 0.5
local testing = "Restaurant"
guicontainer = game.CoreGui -- LocalPlayer.PlayerGui
local datafile_name = "bridgeradii.json"

-- traditional 2018 order
local order = {
	"Restaurant",
	"Gazebo",
	"Spa",
	"Big",
	"Shop",
	"Castle",
	"South-West",
	"South-East",
	"SubZero",
	"Popcorn",
	"Telephone",
	"Mid-East",
	"Mid-West",
	"Factory",
	"North",
	"Candy"
}

local HttpService = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")
local LocalPlayer = game:GetService("Players").LocalPlayer

local Easterbury = 1556130046
local Library = 1556120727

if game.PlaceId ~= Easterbury then
	TeleportService:Teleport(Easterbury, LocalPlayer)
	task.wait(60)
else
	task.wait(10)
end

local data
pcall(function()
	if not isfile(datafile_name) then
		local datatable = {}
		for _,v in ipairs(order) do
			datatable[v] = -1
		end
		writefile(datafile_name, HttpService:JSONEncode(datatable))
	end
end)
pcall(function()
	data = readfile(datafile_name)
	data = HttpService:JSONDecode(data)
	for k,v in pairs(data) do
		if v == -1 then
			testing = k
			break
		end
	end
end)

local markers = {
	{"RestaurantStart", CFrame.new(-421.760498, 3.8589344, 341.208557, 0.629320264, 0, -0.777146339, 0, 1, 0, 0.777146101, 0, 0.629320145)},
	{"CastleStart", CFrame.new(-272.919037, 3.64179039, 314.986145, 0.707106948, 0, -0.70710665, 0, 1, 0, 0.707106829, 0, 0.707106948)},
	{"South-WestStart", CFrame.new(-356.288513, 3.66295218, 160.0672, 0.819151998, 0, 0.573576689, 0, 1, 0, -0.57357651, 0, 0.819152236)},
	{"South-EastStart", CFrame.new(-424.835175, 3.92000008, 10.4322395, 0.898794055, 0, 0.438371181, 0, 1, 0, -0.438371152, 0, 0.898794115)},
	{"SubZeroStart", CFrame.new(-586.160156, 3.74147129, -54.3949928, 0.529919267, 0, 0.848048151, 0, 1, 0, -0.848048151, 0, 0.529919267)},
	{"PopcornStart", CFrame.new(-728.299072, 3.91199064, 19.3735256, 0.4226183, 0, -0.906307876, 0, 1, 0, 0.906307817, 0, 0.422618359)},
	{"TelephoneStart", CFrame.new(-828.384155, 3.98999977, 109.221001, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"GazeboStart", CFrame.new(-473.541992, 3.81999993, 514.770081, 0.913545549, 0, 0.406736583, 0, 1, 0, -0.406736583, 0, 0.913545549)},
	{"FactoryStart", CFrame.new(-620.856079, 3.81054306, 653.381409, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"NorthStart", CFrame.new(-821.233643, 3.61523628, 528.8125, 0.874619722, 0, 0.484809607, 0, 1, 0, -0.484809607, 0, 0.874619722)},
	{"CandyStart", CFrame.new(-856.13269, 4.03507042, 335.840179, 0.961261868, 0, -0.275637299, 0, 1, 0, 0.275637358, 0, 0.96126169)},
	{"Mid-EastStart", CFrame.new(-730.16394, 3.88581371, 236.199112, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"Mid-WestStart", CFrame.new(-646.329163, 3.76999998, 320.151581, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"ShopStart", CFrame.new(-163.79129, 3.54005241, 432.238251, 0.681998312, 0, 0.73135376, 0, 1, 0, -0.7313537, 0, 0.681998312)},
	{"BigStart", CFrame.new(-34.6748543, 4.77999973, 596.095581, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"SpaStart", CFrame.new(-243.584183, 3.98000002, 716.306091, 0.990268111, 0, 0.13917312, 0, 1, 0, -0.13917312, 0, 0.990268171)},
	{"RestaurantCenter", CFrame.new(-409.536011, 3.8589344, 331.309235, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"CastleCenter", CFrame.new(-282.047791, 3.64179039, 305.857361, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"South-WestCenter", CFrame.new(-361.531006, 3.66295218, 152.580154, 0.819151998, 0, 0.573576689, 0, 1, 0, -0.57357651, 0, 0.819152236)},
	{"South-EastCenter", CFrame.new(-429.53891, 3.92000008, 0.78817904, 0.898794055, 0, 0.438371181, 0, 1, 0, -0.438371152, 0, 0.898794115)},
	{"SubZeroCenter", CFrame.new(-589.148926, 3.74147129, -49.6119995, 0.529919207, 0, 0.848048031, 0, 1, 0, -0.848048031, 0, 0.529919207)},
	{"PopcornCenter", CFrame.new(-735.150757, 3.91199064, 22.5685196, 0.4226183, 0, -0.906307757, 0, 1, 0, 0.906307817, 0, 0.422618359)},
	{"TelephoneCenter", CFrame.new(-828.384155, 3.98999977, 119.471001, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"GazeboCenter", CFrame.new(-479.909393, 3.81999993, 517.60498, 0.913545549, 0, 0.406736583, 0, 1, 0, -0.406736583, 0, 0.913545549)},
	{"FactoryCenter", CFrame.new(-629.946106, 3.81054306, 653.381409, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"NorthCenter", CFrame.new(-825.892639, 3.61523628, 520.40741, 0.874619722, 0, 0.484809607, 0, 1, 0, -0.484809607, 0, 0.874619722)},
	{"CandyCenter", CFrame.new(-852.152466, 4.03507042, 321.959564, 0.961261868, 0, -0.275637299, 0, 1, 0, 0.275637358, 0, 0.96126169)},
	{"Mid-EastCenter", CFrame.new(-714.553955, 3.88581371, 236.199112, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"Mid-WestCenter", CFrame.new(-646.329163, 3.76999998, 333.131592, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"ShopCenter", CFrame.new(-150.290497, 3.54005241, 444.827942, 0.681998312, 0, 0.73135376, 0, 1, 0, -0.7313537, 0, 0.681998312)},
	{"BigCenter", CFrame.new(-59.8748512, 4.77999973, 596.095581, 1, 0, 0, 0, 1, 0, 0, 0, 1)},
	{"SpaCenter", CFrame.new(-241.957245, 3.98000002, 727.882324, 0.990268111, 0, 0.13917312, 0, 1, 0, -0.13917312, 0, 0.990268171)},
}


-- Generated with Syntax's Converter (Modified)
local function CreateInstance(cls,props)
	local inst = Instance.new(cls)
	for i,v in pairs(props) do
		inst[i] = v
	end
	return inst
end
local BridgeTesting_var = CreateInstance('ScreenGui',{DisplayOrder=0,Enabled=true,ResetOnSpawn=true,Name='BridgeTesting', Parent=guicontainer})
local BridgeName_var = CreateInstance('TextLabel',{Font=Enum.Font.SourceSans,FontSize=Enum.FontSize.Size96,Text='',TextColor3=Color3.new(1, 1, 1),TextScaled=false,TextSize=100,TextStrokeColor3=Color3.new(0, 0, 0),TextStrokeTransparency=0,TextTransparency=0,TextWrapped=false,TextXAlignment=Enum.TextXAlignment.Center,TextYAlignment=Enum.TextYAlignment.Center,Active=false,AnchorPoint=Vector2.new(0.5, 0),BackgroundColor3=Color3.new(1, 1, 1),BackgroundTransparency=1,BorderColor3=Color3.new(0, 0, 0),BorderSizePixel=0,ClipsDescendants=false,Draggable=false,Position=UDim2.new(0.5, 0, 0.100000001, 0),Rotation=0,Selectable=false,Size=UDim2.new(0, 800, 0, 100),SizeConstraint=Enum.SizeConstraint.RelativeXY,Visible=true,ZIndex=1,Name='BridgeName',Parent = BridgeTesting_var})
local BridgeStatus_var = CreateInstance('TextLabel',{Font=Enum.Font.SourceSans,FontSize=Enum.FontSize.Size60,Text='',TextColor3=Color3.new(1, 1, 1),TextScaled=false,TextSize=50,TextStrokeColor3=Color3.new(0, 0, 0),TextStrokeTransparency=0,TextTransparency=0,TextWrapped=false,TextXAlignment=Enum.TextXAlignment.Center,TextYAlignment=Enum.TextYAlignment.Center,Active=false,AnchorPoint=Vector2.new(0.5, 0),BackgroundColor3=Color3.new(1, 1, 1),BackgroundTransparency=1,BorderColor3=Color3.new(0, 0, 0),BorderSizePixel=0,ClipsDescendants=false,Draggable=false,Position=UDim2.new(0.5, 0, 0.192592591, 0),Rotation=0,Selectable=false,Size=UDim2.new(0, 800, 0, 100),SizeConstraint=Enum.SizeConstraint.RelativeXY,Visible=true,ZIndex=1,Name='BridgeStatus',Parent = BridgeTesting_var})
local Checkmark_var = CreateInstance('ImageLabel',{Image='rbxassetid://101200919179189',ImageColor3=Color3.new(1, 1, 1),ImageRectOffset=Vector2.new(0, 0),ImageRectSize=Vector2.new(0, 0),ImageTransparency=0,ScaleType=Enum.ScaleType.Stretch,SliceCenter=Rect.new(0, 0, 0, 0),Active=false,AnchorPoint=Vector2.new(0.5, 0),BackgroundColor3=Color3.new(1, 1, 1),BackgroundTransparency=1,BorderColor3=Color3.new(0, 0, 0),BorderSizePixel=0,ClipsDescendants=false,Draggable=false,Position=UDim2.new(0.5, 0, 0.291999996, 0),Rotation=0,Selectable=false,Size=UDim2.new(0, 100, 0, 100),SizeConstraint=Enum.SizeConstraint.RelativeXY,Visible=false,ZIndex=1,Name='Checkmark',Parent = BridgeTesting_var})
local Cross_var = CreateInstance('ImageLabel',{Image='rbxassetid://11598076950',ImageColor3=Color3.new(1, 1, 1),ImageRectOffset=Vector2.new(0, 0),ImageRectSize=Vector2.new(0, 0),ImageTransparency=0,ScaleType=Enum.ScaleType.Stretch,SliceCenter=Rect.new(0, 0, 0, 0),Active=false,AnchorPoint=Vector2.new(0.5, 0),BackgroundColor3=Color3.new(1, 1, 1),BackgroundTransparency=1,BorderColor3=Color3.new(0, 0, 0),BorderSizePixel=0,ClipsDescendants=false,Draggable=false,Position=UDim2.new(0.499568403, 0, 0.28477779, 0),Rotation=0,Selectable=false,Size=UDim2.new(0, 117, 0, 117),SizeConstraint=Enum.SizeConstraint.RelativeXY,Visible=false,ZIndex=1,Name='Cross',Parent = BridgeTesting_var})
local uis1 = Instance.new("UIStroke", BridgeName_var)
uis1.Thickness = 4
local uis1 = Instance.new("UIStroke", BridgeStatus_var)
uis1.Thickness = 4
game:GetService("ContentProvider"):PreloadAsync({Checkmark_var.Image, Cross_var.Image})

game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.All,false)
game:GetService("UserInputService").MouseIconEnabled = false
pcall(function()
	guicontainer.TopBarApp.TopBarApp.Enabled = false
end)

local baseplate = Instance.new("Part", workspace)
baseplate.Anchored = true
baseplate.Size = Vector3.new(1510, 0.001, 1720)
baseplate.Position = Vector3.new(-514, YLevel, 651)
baseplate.Transparency = 1
baseplate.CanCollide = true
baseplate.Name = "Baseplate"

local marker_folder = Instance.new("Folder", workspace)
marker_folder.Name = "BridgeMarker"
for _,v in pairs(markers) do
	local marker = Instance.new("Part", marker_folder)
	marker.Anchored = true
	marker.CanCollide = false
	marker.Size = Vector3.new(2, 2, 2)
	marker.Color = Color3.new(1, 0, 0)
	if v[1]:match("Center") then
		marker.Transparency = 0.5
	else
		marker.Transparency = 1
	end
	local mesh = Instance.new("SpecialMesh", marker)
	mesh.MeshId = "rbxassetid://1221597201"
	marker.Name = v[1]
	marker.CFrame = v[2]
end

local function Tween(Object, Length, Style, Direction, Properties, Async)
	local Tween = game:GetService("TweenService"):Create(
		Object,
		TweenInfo.new(Length, Enum.EasingStyle[Style].Value, Enum.EasingDirection[Direction].Value),
		Properties
	)

	Tween:Play()
	if not Async then
		Tween.Completed:Wait()
	end
	Tween:Destroy()
end

task.wait(1)

local char = LocalPlayer.Character
local hrp = char.HumanoidRootPart
local hum = char.Humanoid
hum.WalkSpeed = 50

for _,v in ipairs(workspace:GetDescendants()) do
	if not v:IsA("BasePart") then continue end
	if v:IsDescendantOf(char) then
		local h = Instance.new("Highlight", v)
		h.FillTransparency = 1
		h.OutlineTransparency = 0.85
		v.CanCollide = false
	elseif v.Name ~= "Baseplate" then
		v.CanCollide = false
	end
end

for _,v in ipairs(LocalPlayer.PlayerGui:GetChildren()) do
	if v:IsA("ScreenGui") then
		v:Destroy()
	end
end

-- skip the 15 bridges we don't currently care about
for _, bridge_name in ipairs(order) do
	if bridge_name == testing then continue end
	BridgeName_var.Text = bridge_name .. " Bridge"
	BridgeStatus_var.Text = "Skipping"
	local start = workspace.BridgeMarker[bridge_name .. "Start"].CFrame
	local center = workspace.BridgeMarker[bridge_name .. "Center"].CFrame
	local direction = (center.Position - start.Position).Unit
	local orthogonal = Vector3.new(-direction.Z, 0, direction.X)

	workspace.CurrentCamera.CameraType = Enum.CameraType.Scriptable
	workspace.CurrentCamera.CFrame = CFrame.new(center.Position + direction * -35 + Vector3.new(0, 20, 0), center.Position)


	local start_pos = CFrame.new(center.Position + direction * -25 + Vector3.new(0, YLevel + 2, 0), center.Position)
	local end_pos = CFrame.new(center.Position + direction * 25 + Vector3.new(0, YLevel + 2, 0), center.Position)
	hrp.CFrame = start_pos

	hum:MoveTo(end_pos.Position)

	task.wait(2.5)
end

-- test the bridge of interest
local popped = false
game:GetService("ReplicatedStorage").NetworkRemotes.RemotePlaySound.OnClientEvent:Connect(function(sound)
	if sound:match("9109726876") then popped = true end
end)

BridgeName_var.Text = testing .. " Bridge"
local start = workspace.BridgeMarker[testing .. "Start"].CFrame
local center = workspace.BridgeMarker[testing .. "Center"].CFrame
local direction = (center.Position - start.Position).Unit
local orthogonal = Vector3.new(-direction.Z, 0, direction.X)
while not popped and offset_test > 0 do
	Cross_var.Visible = false
	BridgeStatus_var.Text = "Testing y = " .. baseplate.Position.Y .. ", r = " .. offset_test

	workspace.CurrentCamera.CameraType = Enum.CameraType.Scriptable
	workspace.CurrentCamera.CFrame = CFrame.new(center.Position + direction * -35 + Vector3.new(0, 20, 0), center.Position)


	local start_pos = CFrame.new(center.Position + direction * -25 + orthogonal * offset_test + Vector3.new(0, 2, 0), center.Position)
	local end_pos = CFrame.new(center.Position + direction * 25 + orthogonal * offset_test + Vector3.new(0, 2, 0), center.Position)
	hrp.CFrame = start_pos

	hum:MoveTo(end_pos.Position)
	
	task.wait(2.0)
	if not popped then
		Cross_var.Visible = true
	else 
		break	
	end
	task.wait(1.5)
	offset_test -= precision
end
if not popped then
	Checkmark_var.Visible = false
	Cross_var.Visible = true
	BridgeStatus_var.Text = "Testing Failed"
else
	Checkmark_var.Visible = true
	Cross_var.Visible = false
	pcall(function()
		if data ~= nil then
			data[testing] = offset_test
			writefile(datafile_name, HttpService:JSONEncode(data))
		end
	end)
end
workspace.CurrentCamera.CameraType = Enum.CameraType.Custom
task.wait(5)
TeleportService:Teleport(Library, LocalPlayer)