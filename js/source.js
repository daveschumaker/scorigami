var g_data;
var MAX_HUE = 240.0;
var mode;

var MODE_COUNT = "count";
var MODE_FIRST_GAME = "firstGame";
var MODE_LAST_GAME = "lastGame";

$.ajax({
	url: '/data',						
	success: function(data) {
		//console.log('success');
		//console.log(data);
		g_data = data;
		console.log(data);
		checkReady();
	},
	error: function(data) {
		console.log('error');
		console.log(data);
		
		// two arguments: the id of the Timeline container (no '#')
		// and the JSON object or an instance of TL.TimelineConfig created from
		// a suitable JSON object
		//window.timeline = new TL.Timeline('timeline-embed', 'marktwain_test.json');
	}
});

window.onload = function()
{
	checkReady();
};

function checkReady()
{
	if(g_data && document.readyState === "complete") 
	{ 
		render(); 
		setupEvents();
	}
}

//sets up table
function render()
{
	var matrix = g_data.matrix;
	
	var table = document.getElementById('scoreTable');
	var htmlstring = "";
	
	//cycle through all elements in the table (maxpts will always be the length and width of the matrix)
	//start at -1 so labels can be added
	for(var i = -1; i <= g_data.maxpts; i++)
	{
		htmlstring += "<tr id='row_" + i + "'>";
		for(var j = 0; j <= g_data.maxpts + 1; j++)
		{
			//if i==-1, we are in the label row
			if(i == -1)
			{
				//do not label the top right cell, since the left column is all labels
				if (j > g_data.maxpts)
				{
					htmlstring += "<th></th>";
				}
				//adding column lables
				else 
				{
					htmlstring += "<th id='colHeader_" + j + "'>" + j + "</th>";
				}
			}
			else
			{
				//coloring black squares
				if(j < i - 1)
				{
					htmlstring += "<td class='black'></td>";
				}
				//adding row label
				else if (j == i - 1)
				{
					htmlstring += "<th id='specialHeader_" + i + "' class='black'></th>";
				}
				//adding row label
				else if (j == g_data.maxpts + 1)
				{
					htmlstring += "<th id='rowHeader_" + i + "'>" + i + "</th>";
				}
				//color in green squares
				else if (matrix[i][j].count > 0)
				{
					htmlstring += "<td id='cell_" + i + "-" + j + "' class='green'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'><div id='hover_" + i + "-" + j + "' class='hover'><div id='count_" + i + "-" + j + "' class='count'>" + matrix[i][j].count + "</div></div></a></td>";
				}
				//fill in empty squares
				else
				{
					//color black squares for impossible scores along 1 point line
					//NOTE: we can do this after coloring in the green squares since these squares will never be green
					if( i == 1)
					{
						switch (j)
						{
							case 1:
							case 2: 
							case 3: 
							case 4:
							case 5:
							case 7: 
								htmlstring += "<td class='black'></td>";
								break;
							default:
								htmlstring += "<td id='cell_" + i + "-" + j + "' class='blank'><div id='hover_" + i + "-" + j + "' class='hover'></div></td>";
								break;
								
						}
					}
					//color 0,1 square black since that is also impossible
					//NOTE: we can do this after coloring in the green squares since this square will never be green
					else if (i == 0 && j == 1)
					{
						htmlstring += "<td class='black'></td>";
					}
					else
					{
						htmlstring += "<td id='cell_" + i + "-" + j + "' class='blank'><div id='hover_" + i + "-" + j + "' class='hover'></div></td>";
					}
				}
			}
		}
		htmlstring += "</tr>";
	}
	table.innerHTML = htmlstring;
	
	var loadingTable = document.getElementById("loadingTable");
	if(loadingTable)
	{
		loadingTable.classList.add("hidden");
	}
	
	//populate hue spectrum (because doing this manually would be tedious)
	htmlstringLogarithmic = "";
	htmlstringLinear = "";
	//var cssString = "background: linear-gradient(to right";
	var hueSpectrumLogarithmicColors = document.getElementById("hueSpectrumLogarithmicColors");
	var hueSpectrumLinearColors = document.getElementById("hueSpectrumLinearColors");
	
	var num = 600 / Math.log(MAX_HUE + 2);
	
	for(var i = 0; i <= MAX_HUE; i++)
	{
		var width = (Math.log(MAX_HUE + 2 - i) - Math.log(MAX_HUE + 1 - i)) * num;
		htmlstringLogarithmic += "<span id='hueLog_" + i + "' class='hueColor' style='background-color:hsl(" + (MAX_HUE - i) + ",50%,50%);width:" + width + "px'></span>";
		htmlstringLinear += "<span id='hueLin_" + i + "' class='hueColor' style='background-color:hsl(" + (MAX_HUE - i) + ",50%,50%);width:2.5px'></span>";
	}
	
	hueSpectrumLogarithmicColors.innerHTML = htmlstringLogarithmic;
	hueSpectrumLinearColors.innerHTML = htmlstringLinear;
	
	var hueSpectrumLogarithmicLabelMaxCount = document.getElementById("hueSpectrumLogarithmicLabelMaxCount");
	if(hueSpectrumLogarithmicLabelMaxCount)
	{
		hueSpectrumLogarithmicLabelMaxCount.innerHTML = g_data.maxcount;
	}
	var hueSpectrumLinearLabelMaxCount = document.getElementById("hueSpectrumLinearLabelMaxCount");
	if(hueSpectrumLinearLabelMaxCount)
	{
		hueSpectrumLinearLabelMaxCount.innerHTML = new Date().getFullYear();
	}
	
	var video = document.getElementById("video")
	if(video)
	{
		video.src = "https://www.youtube.com/embed/9l5C8cGMueY?rel=0";
	}
	
	var lastUpdated = document.getElementById("lastUpdated");
	if(lastUpdated)
	{
		lastUpdated.innerHTML = "Last Updated: " + g_data.lastUpdated + ".";
	}
}

function setupEvents()
{
	//add hover events to cells
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = 0; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				cell.addEventListener('mouseover', mouseOverDelegate(i, j));
				cell.addEventListener('mouseout', mouseOffDelegate(i, j));
			}
		}
	}
	
	var modeSelector = document.getElementById("modeSelector");
	if(modeSelector)
	{
		mode = modeSelector.options[modeSelector.selectedIndex].value;
		modeSelector.addEventListener('change', function(e){changeMode();});
	}
	
	var countSwitch = document.getElementById("countSwitch");
	if(countSwitch)
	{
		countSwitch.addEventListener('change', function(e){toggleNumber(e.target.checked);});
	}
	
	var gradientSwitch = document.getElementById("gradientSwitch");
	if(gradientSwitch)
	{
		gradientSwitch.addEventListener('change', function(e){toggleGradient(e.target.checked);});
	}
	
	var emptyRowsSwitch = document.getElementById("emptyRowsSwitch");
	if(emptyRowsSwitch)
	{
		emptyRowsSwitch.addEventListener('change', function(e){toggleEmptyRows(e.target.checked);});
	}
	
	var yearSlider = document.getElementById("yearSlider");
	if(yearSlider)
	{
		var date = new Date().getFullYear();
		yearSlider.max = date;
		yearSlider.value = date;
		yearSlider.addEventListener('input', function(e){(changeYearSlider());});
	}
	
	changeMode();
}

function changeMode()
{
	var modeSelector = document.getElementById("modeSelector");
	if(modeSelector)
	{
		mode = modeSelector.options[modeSelector.selectedIndex].value;
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var div = document.getElementById("count_" + i + "-" + j);
			if(div)
			{
				switch(mode)
				{
					case MODE_FIRST_GAME:
						div.innerHTML = g_data.matrix[i][j].first_date.substr(0,4);
						div.style.fontSize="6px";
						break;
					case MODE_LAST_GAME:
						div.innerHTML = g_data.matrix[i][j].last_date.substr(0,4);
						div.style.fontSize="6px";
						break;
					case MODE_COUNT:
					default:
						div.innerHTML = g_data.matrix[i][j].count;
						div.style.fontSize="8px";
						break;
				}
			}
		}
	}
	
	var countSwitchText = document.getElementById("countSwitchText");
	if(countSwitchText)
	{
		switch(mode)
		{
			case MODE_FIRST_GAME:
			case MODE_LAST_GAME:
				countSwitchText.innerHTML = "Show Year";
				break;
			case MODE_COUNT:
			default:
				countSwitchText.innerHTML = "Show Count";
				break;
		}
	}
	
	switch(mode)
	{
		case MODE_FIRST_GAME:
			showSlider();
			break;
		case MODE_LAST_GAME:
		case MODE_COUNT:
		default:
			hideSlider();
			break;
	}
	
	toggleNumber(countSwitch.checked);
	toggleGradient(gradientSwitch.checked);
	toggleEmptyRows(emptyRowsSwitch.checked);
}

function showSlider()
{
	var sliderContainer = document.getElementById("sliderContainer");
	if(sliderContainer)
	{
		sliderContainer.classList.remove("hidden");
	}
	changeYearSlider();
}

function hideSlider()
{
	var sliderContainer = document.getElementById("sliderContainer");
	if(sliderContainer)
	{
		sliderContainer.classList.add("hidden");
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				cell.classList.remove("later");
				cell.classList.remove("red");
			}
		}
	}
}

function changeYearSlider()
{
	var value = document.getElementById("yearSlider").value;
	
	var sliderValue = document.getElementById("sliderValue");
	if(sliderValue)
	{
		sliderValue.innerHTML = value;
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell && cell.classList.contains("green"))
			{
				var year = parseInt(g_data.matrix[i][j].first_date.substr(0,4))
				if(year > value)
				{
					cell.classList.add("later");
					cell.classList.remove("red");
				}
				else if (year == value)
				{
					cell.classList.add("red");
					cell.classList.remove("later");
				}
				else
				{
					cell.classList.remove("red");
					cell.classList.remove("later");
				}
			}
		}
	}
	
}

//shades the cells based on the number of times that score has been achieved
function toggleGradient(on)
{
	var matrix = g_data.matrix;
	
	var max;
	var min
	
	switch(mode)
	{
		case MODE_FIRST_GAME:
		case MODE_LAST_GAME:
			max = new Date().getFullYear();
			min = 1920;
			break;
		case MODE_COUNT:
		default:
			max = Math.log(g_data.maxcount);
			min = 0;
			break;
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				if(on)
				{
					cell.classList.add("gradient");
					if (cell.classList.contains("green"))
					{
						// var alpha = 0.9 * matrix[i][j].count / g_data.maxcount + 0.1;
						// cell.style.backgroundColor = "rgba(0,128,0," + alpha + ")";
						var hue;
						switch(mode)
						{
							case MODE_FIRST_GAME:
								var year = parseInt(matrix[i][j].first_date.substr(0,4));
								hue = MAX_HUE - MAX_HUE * (year - min) / (max - min);
								break;
							case MODE_LAST_GAME:
								var year = parseInt(matrix[i][j].last_date.substr(0,4));
								hue = MAX_HUE - MAX_HUE * (year - min) / (max - min);
								break;
							case MODE_COUNT:
							default:
								var hue = MAX_HUE - MAX_HUE * Math.log(matrix[i][j].count) / max;
								break;
						}
						cell.style.backgroundColor = "hsl(" + hue + ",50%,50%)";
					}
				}
				else
				{
					cell.classList.remove("gradient");
					if (cell.classList.contains("green"))
					{
						cell.style.backgroundColor = "";
					}
				}
			}
		}
	}
	var spectrumLogarithmic = document.getElementById("hueSpectrumLogarithmic");
	if(spectrumLogarithmic)
	{
		if(on && mode == MODE_COUNT)
		{
			spectrumLogarithmic.classList.remove("hidden");
		}
		else
		{
			spectrumLogarithmic.classList.add("hidden");
		}
	}
	var spectrumLinear = document.getElementById("hueSpectrumLinear");
	if(spectrumLinear)
	{
		if(on && (mode == MODE_FIRST_GAME || mode == MODE_LAST_GAME))
		{
			spectrumLinear.classList.remove("hidden");
		}
		else
		{
			spectrumLinear.classList.add("hidden");
		}
	}
}

function toggleNumber(on)
{
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var div = document.getElementById("count_" + i + "-" + j);
			if(div)
			{
				if(on)
				{
					div.classList.remove("hidden");
				}
				else
				{
					div.classList.add("hidden");
				}
			}
		}
	}
}

function toggleEmptyRows(on)
{
	for(var i = g_data.maxlosepts + 1; i <= g_data.maxpts; i++)
	{
		var row = document.getElementById("row_" + i);
		if(row)
		{
			if(on)
			{
				row.classList.remove("hidden");
			}
			else
			{
				row.classList.add("hidden");
			}
		}
	}
}

//called when user moves mouse over an element
//adds adjhover class to all elements in the same row and column as the hovered element
function mouseOver(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		// var cell = document.getElementById("cell_" + i + "-" + k);
		// if(cell && k != j)
		// {
			// cell.classList.add("adjhoverH");
		// }
		// var cell = document.getElementById("cell_" + k + "-" + j);
		// if(cell && k != i)
		// {
			// cell.classList.add("adjhoverV");
		// }
		var cell = document.getElementById("hover_" + i + "-" + k);
		if(cell && k != j)
		{
			cell.classList.add("adjhover");
		}
		var cell = document.getElementById("hover_" + k + "-" + j);
		if(cell && k != i)
		{
			cell.classList.add("adjhover");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.add("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.add("adjhover");
	var specialHeader2 = document.getElementById("specialHeader_" + (j + 1));
	if(specialHeader2)
	{
		specialHeader2.innerHTML = j;
		specialHeader2.classList.add("adjhover");
	}
	var specialHeader = document.getElementById("specialHeader_" + i);
	if(specialHeader)
	{
		specialHeader.innerHTML = i;
		specialHeader.classList.add("adjhover");
	}
}
//called when moves mouse off an element
//removes adjhover class to all elements in the same row and column as the hovered element
function mouseOff(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		// var cell = document.getElementById("cell_" + i + "-" + k);
		// if(cell && k != j)
		// {
			// cell.classList.remove("adjhoverH");
		// }
		// var cell = document.getElementById("cell_" + k + "-" + j);
		// if(cell && k != i)
		// {
			// cell.classList.remove("adjhoverV");
		// }
		var cell = document.getElementById("hover_" + i + "-" + k);
		if(cell && k != j)
		{
			cell.classList.remove("adjhover");
		}
		var cell = document.getElementById("hover_" + k + "-" + j);
		if(cell && k != i)
		{
			cell.classList.remove("adjhover");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.remove("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.remove("adjhover");
	var specialHeader2 = document.getElementById("specialHeader_" + (j + 1));
	if(specialHeader2)
	{
		specialHeader2.innerHTML = "";
		specialHeader2.classList.remove("adjhover");
	}
	var specialHeader = document.getElementById("specialHeader_" + i);
	if(specialHeader)
	{
		specialHeader.innerHTML = "";
		specialHeader.classList.remove("adjhover");
	}
}

//delegate functions to make it possible to create event liteners in a loop
function mouseOverDelegate(i, j) {
  return function(){
      mouseOver(i, j);
  }
}
function mouseOffDelegate(i, j) {
  return function(){
      mouseOff(i, j);
  }
}