import Fuse from 'fuse.js';
import type { FoodComboIngredient } from './types';

// Comprehensive synonyms and alternative names for ingredients
// Maps canonical name (lowercase) to alternative search terms
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  // ===== SWEETENERS & SYRUPS =====
  'agave syrup': ['agave nectar', 'agave', 'blue agave'],
  'brown rice syrup': ['rice syrup', 'rice malt syrup'],
  'corn syrup': ['glucose syrup', 'maize syrup'],
  'golden syrup': ['light treacle', 'golden cane syrup'],
  'honey': ['raw honey', 'pure honey', 'honeycomb'],
  'maple syrup': ['pure maple syrup', 'maple', 'real maple syrup'],
  'molasses': ['treacle', 'black treacle', 'blackstrap molasses'],
  'simple syrup': ['sugar syrup', 'bar syrup'],
  'chocolate syrup': ['chocolate sauce', 'hersheys syrup'],

  // ===== SUGARS =====
  'sugar, white': ['white sugar', 'granulated sugar', 'caster sugar', 'castor sugar', 'table sugar', 'regular sugar'],
  'sugar, brown': ['brown sugar', 'light brown sugar', 'dark brown sugar', 'muscovado'],
  'powdered sugar': ['icing sugar', 'confectioners sugar', 'confectioner sugar', '10x sugar'],
  'turbinado sugar': ['raw sugar', 'demerara sugar', 'sugar in the raw'],

  // ===== FLOURS & STARCHES =====
  'all-purpose flour': ['plain flour', 'ap flour', 'white flour', 'all purpose flour', 'regular flour'],
  'almond flour': ['almond meal', 'ground almonds'],
  'bread flour': ['strong flour', 'high gluten flour', 'bread machine flour'],
  'buckwheat flour': ['buckwheat', 'soba flour'],
  'cake flour': ['soft flour', 'sponge flour'],
  'chickpea flour': ['gram flour', 'besan', 'garbanzo flour', 'chana flour'],
  'coconut flour': ['coconut powder'],
  'corn starch': ['cornstarch', 'corn flour', 'maize starch', 'maizena'],
  'oat flour': ['ground oats', 'oatmeal flour'],
  'rice flour': ['ground rice', 'rice powder'],
  'rye flour': ['rye meal'],
  'self-raising flour': ['self rising flour', 'self-rising flour', 'raising flour'],
  'semolina flour': ['semolina', 'durum flour', 'pasta flour'],
  'tapioca flour': ['tapioca starch', 'cassava flour', 'cassava starch'],
  'whole wheat flour': ['wholemeal flour', 'graham flour', 'whole grain flour'],
  'arrowroot powder': ['arrowroot starch', 'arrowroot'],
  'potato starch': ['potato flour'],

  // ===== GRAINS & RICE =====
  'arborio rice': ['risotto rice', 'italian rice'],
  'basmati rice': ['basmati', 'indian rice'],
  'brown rice': ['whole grain rice', 'wholegrain rice'],
  'jasmine rice': ['thai rice', 'fragrant rice'],
  'short-grain rice': ['sushi rice', 'japanese rice', 'calrose rice'],
  'white rice': ['long grain rice', 'regular rice'],
  'wild rice': ['wild grain', 'black rice'],
  'barley': ['pearl barley', 'hulled barley'],
  'bulgur': ['bulghur', 'cracked wheat', 'burgul'],
  'couscous': ['cous cous', 'moroccan pasta'],
  'farro': ['emmer wheat', 'emmer'],
  'millet': ['pearl millet'],
  'oats / oatmeal': ['oats', 'oatmeal', 'rolled oats', 'old fashioned oats', 'porridge oats', 'quick oats'],
  'quinoa': ['keen-wa', 'quinua'],
  'grits': ['hominy grits', 'corn grits'],
  'polenta': ['cornmeal mush', 'maize porridge'],
  'cornmeal': ['corn meal', 'maize meal', 'polenta'],

  // ===== PASTA & NOODLES =====
  'angel hair pasta': ['capellini', 'angel hair', 'thin spaghetti'],
  'chow mein noodles': ['chow mein', 'crispy noodles', 'fried noodles'],
  'egg noodles': ['egg pasta', 'german noodles'],
  'farfalle pasta': ['farfalle', 'bow tie pasta', 'bowtie pasta', 'butterfly pasta'],
  'fettuccine': ['fettuccini', 'tagliatelle'],
  'fusilli': ['rotini', 'spiral pasta', 'corkscrew pasta'],
  'gnocchi': ['potato gnocchi', 'italian dumplings'],
  'lasagna noodles': ['lasagna sheets', 'lasagne', 'lasagna'],
  'linguine': ['linguini', 'flat spaghetti'],
  'macaroni': ['elbow macaroni', 'elbow pasta', 'mac'],
  'orzo': ['risoni', 'rice pasta'],
  'penne': ['penne rigate', 'mostaccioli', 'tube pasta'],
  'ramen noodles': ['ramen', 'instant noodles', 'cup noodles'],
  'ravioli': ['stuffed pasta', 'filled pasta'],
  'rice noodles': ['rice sticks', 'pad thai noodles', 'vermicelli', 'pho noodles'],
  'rigatoni': ['large tube pasta'],
  'rotini': ['fusilli', 'spiral pasta'],
  'soba noodles': ['soba', 'buckwheat noodles', 'japanese noodles'],
  'spaghetti': ['pasta', 'long pasta'],
  'tortellini': ['stuffed pasta rings'],
  'udon noodles': ['udon', 'thick japanese noodles'],
  'ziti pasta': ['ziti', 'baked ziti pasta'],
  'jumbo pasta shells': ['jumbo shells', 'stuffed shells', 'conchiglioni'],
  'pasta shells': ['shell pasta', 'conchiglie'],

  // ===== BREAD & BAKED =====
  'bread': ['loaf', 'sliced bread', 'sandwich bread'],
  'breadcrumbs': ['bread crumbs', 'panko', 'dried breadcrumbs'],
  'panko': ['japanese breadcrumbs', 'panko breadcrumbs'],
  'french bread (baguette)': ['baguette', 'french bread', 'french loaf', 'french stick'],
  'bagels': ['bagel'],
  'crescent rolls': ['croissant dough', 'pillsbury crescents'],
  'english muffin': ['english muffins', 'breakfast muffin'],
  'hamburger buns': ['burger buns', 'hamburger rolls', 'burger rolls'],
  'hot dog buns': ['hotdog buns', 'frankfurter rolls'],
  'naan bread': ['naan', 'nan bread', 'indian bread'],
  'pita bread': ['pita', 'pitta bread', 'pocket bread'],
  'rye bread': ['pumpernickel', 'dark rye'],
  'pizza crust': ['pizza dough', 'pizza base'],
  'pie crust': ['pie shell', 'pastry crust', 'pie dough'],
  'puff pastry': ['puff pastry sheets', 'flaky pastry'],
  'phyllo dough': ['filo dough', 'filo pastry', 'phyllo', 'filo'],
  'graham crackers': ['graham cracker crumbs', 'digestive biscuits'],
  'pretzel': ['pretzels', 'soft pretzel'],
  'croutons': ['bread cubes', 'salad croutons'],

  // ===== TORTILLAS & WRAPS =====
  'corn tortillas': ['corn tortilla', 'maize tortillas'],
  'flour tortillas': ['flour tortilla', 'soft tortillas', 'wheat tortillas'],
  'taco shell': ['taco shells', 'hard taco', 'crispy taco'],
  'tostadas': ['tostada shells', 'crispy tortillas'],
  'tortilla chips': ['corn chips', 'nachos', 'nacho chips'],
  'egg roll wrapper': ['egg roll wrappers', 'spring roll wrappers'],
  'wonton wrapper': ['wonton wrappers', 'wonton skins', 'dumpling wrappers'],
  'rice paper': ['rice paper wrappers', 'spring roll rice paper'],

  // ===== VEGETABLES =====
  'arugula': ['rocket', 'rocket salad', 'rucola', 'roquette'],
  'artichokes': ['artichoke', 'artichoke hearts', 'globe artichoke'],
  'asparagus': ['asparagus spears', 'green asparagus'],
  'avocados': ['avocado', 'avo', 'guac base'],
  'bamboo shoots': ['bamboo shoot', 'bamboo tips'],
  'bean sprouts': ['mung bean sprouts', 'beansprouts', 'sprouts'],
  'beets': ['beetroot', 'beet', 'red beet'],
  'beet greens': ['beetroot leaves', 'beet tops'],
  'bell peppers, green': ['green bell pepper', 'green pepper', 'green capsicum'],
  'bell peppers, red': ['red bell pepper', 'red pepper', 'red capsicum'],
  'bell peppers, yellow': ['yellow bell pepper', 'yellow pepper', 'yellow capsicum'],
  'bell peppers, orange': ['orange bell pepper', 'orange pepper', 'orange capsicum'],
  'bok choy': ['pak choi', 'pak choy', 'chinese cabbage', 'bok choi'],
  'broccoli': ['broccoli florets', 'broccoli crowns'],
  'brussels sprouts': ['brussel sprouts', 'brussels', 'mini cabbages'],
  'cabbage': ['green cabbage', 'white cabbage'],
  'green cabbage': ['cabbage', 'white cabbage'],
  'red cabbage': ['purple cabbage'],
  'napa cabbage': ['chinese cabbage', 'wombok', 'nappa cabbage'],
  'savoy cabbage': ['savoy'],
  'carrots': ['carrot', 'orange carrot'],
  'cassava': ['yuca', 'manioc', 'tapioca root'],
  'cauliflower': ['cauliflower florets', 'cauli'],
  'celeriac': ['celery root', 'celery knob'],
  'celery': ['celery stalks', 'celery sticks', 'celery ribs'],
  'chayote': ['mirliton', 'christophine', 'vegetable pear'],
  'chile peppers': ['chili peppers', 'chilli peppers', 'hot peppers', 'chiles', 'chilies'],
  'corn': ['sweetcorn', 'sweet corn', 'maize', 'corn on the cob', 'corn kernels'],
  'cucumbers': ['cucumber', 'cuke', 'cukes'],
  'daikon': ['daikon radish', 'white radish', 'mooli', 'chinese radish'],
  'dandelion greens': ['dandelion leaves', 'dandelion'],
  'edamame': ['soybeans', 'soy beans', 'green soybeans', 'mukimame'],
  'eggplant': ['aubergine', 'brinjal', 'eggplants'],
  'fennel': ['fennel bulb', 'anise bulb', 'finocchio'],
  'green beans': ['string beans', 'snap beans', 'french beans', 'haricots verts'],
  'green peas': ['peas', 'garden peas', 'english peas', 'sweet peas'],
  'hearts of palm': ['palm hearts', 'palmito'],
  'jicama': ['mexican turnip', 'yam bean'],
  'kale': ['curly kale', 'tuscan kale', 'lacinato kale', 'dinosaur kale'],
  'greens, collard': ['collard greens', 'collards', 'collard'],
  'leeks': ['leek', 'baby leeks'],
  'mushrooms, white': ['white mushrooms', 'button mushrooms', 'white button mushrooms', 'champignon'],
  'mushrooms, cremini': ['cremini mushrooms', 'crimini mushrooms', 'baby bella', 'baby portobello'],
  'mushrooms, portobello': ['portobello mushrooms', 'portabella', 'portabello', 'large mushrooms'],
  'mushrooms, shiitake': ['shiitake mushrooms', 'shiitake', 'chinese mushrooms'],
  'mushrooms, oysters': ['oyster mushrooms', 'oyster'],
  'mushrooms, chanterelles': ['chanterelle mushrooms', 'chanterelles', 'golden chanterelles'],
  'mushrooms, porcini': ['porcini mushrooms', 'porcini', 'cep mushrooms', 'cepes'],
  'mushrooms, morels': ['morel mushrooms', 'morels'],
  'mustard greens': ['mustard leaves', 'leaf mustard'],
  'okra': ['ladyfingers', 'bhindi', 'gumbo'],
  'onions': ['onion', 'yellow onion', 'white onion', 'brown onion', 'cooking onion'],
  'parsnips': ['parsnip'],
  'plantains': ['plantain', 'cooking banana', 'platano'],
  'poblano peppers': ['poblano', 'poblanos', 'ancho pepper'],
  'potatoes': ['potato', 'spud', 'spuds', 'tater', 'russet potato', 'baking potato'],
  'pumpkin': ['pie pumpkin', 'sugar pumpkin'],
  'radishes': ['radish', 'red radish'],
  'ramps': ['wild leeks', 'wild garlic'],
  'rhubarb': ['rhubarb stalks', 'pie plant'],
  'rutabagas': ['swede', 'swedish turnip', 'neep', 'rutabaga'],
  'scallions': ['green onions', 'green onion', 'spring onions', 'spring onion', 'salad onions'],
  'shallots': ['shallot', 'eschalot', 'french shallot'],
  'snap peas': ['sugar snap peas', 'snap pea', 'sugar peas'],
  'spinach': ['baby spinach', 'fresh spinach', 'spinach leaves'],
  'squash, acorn': ['acorn squash', 'pepper squash'],
  'squash, butternut': ['butternut squash', 'butternut', 'butternut pumpkin'],
  'squash, spaghetti': ['spaghetti squash', 'vegetable spaghetti'],
  'sweet potatoes': ['sweet potato', 'yam', 'yams', 'kumara'],
  'tomatillos': ['tomatillo', 'mexican husk tomato', 'green tomato'],
  'tomatoes': ['tomato', 'fresh tomatoes', 'vine tomatoes', 'beefsteak tomato'],
  'sun-dried tomatoes': ['sundried tomatoes', 'sun dried tomatoes', 'dried tomatoes'],
  'turnips': ['turnip', 'white turnip'],
  'water chestnuts': ['water chestnut'],
  'watercress': ['cress', 'water cress'],
  'yams': ['yam', 'tropical yam', 'true yam'],
  'yellow squash': ['summer squash', 'yellow crookneck'],
  'zucchini': ['courgette', 'courgettes', 'zucchinis', 'baby marrow'],

  // ===== LETTUCE & SALAD GREENS =====
  'bibb lettuce': ['bibb', 'butterhead lettuce', 'boston bibb'],
  'boston lettuce': ['boston', 'butter lettuce', 'butterhead'],
  'butter lettuce': ['butterhead', 'boston lettuce', 'bibb lettuce'],
  'iceberg lettuce': ['iceberg', 'crisphead lettuce', 'head lettuce'],
  'romaine lettuce': ['romaine', 'cos lettuce', 'cos'],
  'lettuce, green leaf': ['green leaf lettuce', 'leaf lettuce', 'green lettuce'],
  'lettuce, red leaf': ['red leaf lettuce', 'red lettuce'],
  'belgian endive': ['endive', 'witloof', 'chicory'],
  'curly endive (frisée)': ['frisee', 'frisée', 'curly endive', 'chicory frisee'],
  'escarole': ['broad-leaved endive', 'batavia'],
  'mache': ['lamb lettuce', 'corn salad', 'field salad'],
  'radicchio': ['italian chicory', 'red chicory'],
  'chard': ['swiss chard', 'silverbeet', 'rainbow chard'],

  // ===== HERBS (FRESH & DRIED) =====
  'basil': ['fresh basil', 'sweet basil', 'thai basil', 'holy basil'],
  'bay leaf': ['bay leaves', 'laurel leaf', 'bay laurel'],
  'chervil': ['french parsley'],
  'chives': ['fresh chives', 'chinese chives', 'garlic chives'],
  'cilantro': ['coriander', 'fresh coriander', 'coriander leaves', 'chinese parsley', 'dhania'],
  'dill': ['fresh dill', 'dill weed'],
  'epazote': ['mexican tea', 'wormseed'],
  'fenugreek leaves': ['methi leaves', 'methi', 'kasuri methi'],
  'kaffir lime leaves': ['makrut lime leaves', 'lime leaves'],
  'lemongrass': ['lemon grass', 'citronella'],
  'marjoram': ['sweet marjoram'],
  'mint': ['fresh mint', 'spearmint', 'garden mint'],
  'oregano': ['wild marjoram', 'greek oregano'],
  'parsley': ['fresh parsley', 'flat leaf parsley', 'italian parsley', 'curly parsley'],
  'peppermint': ['peppermint leaves', 'mint'],
  'rosemary': ['fresh rosemary'],
  'sage': ['fresh sage', 'garden sage'],
  'savory': ['summer savory', 'winter savory'],
  'tarragon': ['french tarragon', 'dragon herb'],
  'thyme': ['fresh thyme', 'garden thyme'],

  // ===== SPICES & SEASONINGS =====
  'allspice': ['pimento', 'jamaican pepper', 'myrtle pepper'],
  'amchoor': ['amchur', 'mango powder', 'dried mango powder'],
  'anise seeds': ['aniseed', 'anise', 'sweet cumin'],
  'asafoetida / hing': ['asafoetida', 'hing', 'asafetida', 'devils dung'],
  'black pepper': ['pepper', 'ground pepper', 'peppercorns', 'cracked pepper'],
  'caraway seeds': ['caraway', 'persian cumin'],
  'cardamom': ['cardamon', 'elaichi', 'green cardamom'],
  'cayenne, ground': ['cayenne pepper', 'cayenne', 'red pepper', 'ground red pepper'],
  'celery salt': ['celery seasoning'],
  'celery seed': ['celery seeds'],
  'chili powder': ['chilli powder', 'chile powder'],
  'cinnamon': ['ground cinnamon', 'cinnamon sticks', 'ceylon cinnamon', 'cassia'],
  'cinnamon sugar': ['cinnamon and sugar'],
  'cloves': ['ground cloves', 'whole cloves'],
  'coriander seeds': ['coriander', 'ground coriander', 'dhania seeds'],
  'cumin': ['ground cumin', 'cumin seeds', 'jeera', 'comino'],
  'curry powder': ['curry spice', 'madras curry powder'],
  'dill seeds': ['dill seed'],
  'fennel seeds': ['fennel seed', 'saunf'],
  'fenugreek seeds': ['methi seeds', 'fenugreek'],
  'five spice': ['five spice powder', 'chinese five spice', '5 spice'],
  'garam masala': ['garam masalla', 'indian spice blend'],
  'garlic powder': ['garlic granules', 'dried garlic'],
  'ginger, ground': ['ground ginger', 'ginger powder', 'dried ginger'],
  'juniper berries': ['juniper'],
  'lemon pepper': ['lemon pepper seasoning'],
  'mace': ['ground mace', 'nutmeg flower'],
  'mustard seeds': ['mustard seed', 'yellow mustard seeds', 'brown mustard seeds'],
  'nutmeg': ['ground nutmeg', 'whole nutmeg'],
  'onion powder': ['dried onion', 'onion granules'],
  'paprika': ['sweet paprika', 'hungarian paprika', 'smoked paprika', 'pimenton'],
  'pumpkin pie spice': ['pumpkin spice', 'pie spice'],
  'red pepper flakes': ['crushed red pepper', 'chili flakes', 'pepper flakes', 'red chili flakes'],
  'saffron': ['saffron threads', 'kesar', 'azafran'],
  'seasoning salt': ['seasoned salt', 'lawrys seasoning salt'],
  'sichuan pepper': ['szechuan pepper', 'sichuan peppercorns', 'chinese pepper'],
  'star anise': ['star aniseed', 'chinese star anise', 'badiam'],
  'sumac': ['sumach', 'sumak'],
  'taco seasoning': ['taco spice', 'taco mix'],
  'turmeric': ['turmeric powder', 'ground turmeric', 'haldi', 'curcuma'],
  'white pepper': ['ground white pepper'],

  // ===== FRUITS (FRESH) =====
  'apricots': ['apricot', 'fresh apricots'],
  'bananas': ['banana', 'ripe banana'],
  'blackberries': ['blackberry', 'brambles'],
  'blood oranges': ['blood orange', 'moro orange'],
  'blueberries': ['blueberry', 'wild blueberries'],
  'cantaloupe': ['rockmelon', 'muskmelon', 'cantaloupe melon'],
  'carambola (star fruit)': ['star fruit', 'starfruit', 'carambola'],
  'cherries': ['cherry', 'sweet cherries', 'bing cherries'],
  'clementine': ['clementines', 'cuties', 'halos'],
  'fresh figs': ['figs', 'fig', 'fresh fig'],
  'grapes': ['grape', 'table grapes', 'red grapes', 'green grapes'],
  'grapefruit': ['pink grapefruit', 'ruby red grapefruit'],
  'green apples': ['granny smith', 'granny smith apples', 'green apple', 'sour apple'],
  'guavas': ['guava'],
  'honeydew': ['honeydew melon', 'honey dew'],
  'kiwi': ['kiwifruit', 'kiwi fruit', 'chinese gooseberry'],
  'kumquats': ['kumquat', 'cumquat'],
  'lemons': ['lemon', 'fresh lemon'],
  'limes': ['lime', 'fresh lime', 'persian lime', 'key lime'],
  'lychees': ['lychee', 'litchi', 'lichee'],
  'mangoes': ['mango', 'fresh mango'],
  'nectarines': ['nectarine', 'white nectarine'],
  'orange': ['oranges', 'navel orange', 'fresh orange'],
  'papayas': ['papaya', 'pawpaw', 'paw paw'],
  'passion fruit': ['passionfruit', 'passion fruits', 'maracuja'],
  'peaches': ['peach', 'fresh peaches'],
  'pears': ['pear', 'bartlett pear', 'anjou pear', 'bosc pear'],
  'persimmons': ['persimmon', 'sharon fruit', 'kaki'],
  'pineapples': ['pineapple', 'fresh pineapple'],
  'plums': ['plum', 'fresh plums'],
  'pomegranates': ['pomegranate', 'pom'],
  'raspberries': ['raspberry'],
  'red apples': ['red apple', 'gala apple', 'fuji apple', 'red delicious'],
  'strawberries': ['strawberry', 'fresh strawberries'],
  'tangerines': ['tangerine', 'mandarin', 'mandarin orange', 'satsuma'],
  'watermelon': ['water melon', 'seedless watermelon'],

  // ===== DRIED FRUITS =====
  'apricots, dried': ['dried apricots', 'dried apricot'],
  'cherries, dried': ['dried cherries', 'dried cherry'],
  'cranberries, dried': ['dried cranberries', 'craisins', 'dried cranberry'],
  'dates': ['date', 'medjool dates', 'deglet dates', 'pitted dates'],
  'figs, dried': ['dried figs', 'dried fig'],
  'goji berries': ['goji', 'wolfberries', 'dried goji'],
  'prunes': ['dried plums', 'prune', 'pitted prunes'],
  'raisins': ['raisin', 'dried grapes'],
  'sultanas': ['golden raisins', 'sultana raisins'],
  'zante currants': ['currants', 'dried currants'],

  // ===== DAIRY & EGGS =====
  'butter': ['unsalted butter', 'salted butter', 'sweet cream butter'],
  'buttermilk': ['cultured buttermilk', 'butter milk'],
  'cream': ['heavy cream', 'heavy whipping cream', 'whipping cream', 'double cream', 'single cream'],
  'cream cheese': ['philadelphia', 'philly', 'neufchatel'],
  'creme fraiche': ['crème fraîche', 'creme fresh', 'french sour cream'],
  'condensed milk': ['sweetened condensed milk', 'evaporated milk sweetened'],
  'cottage cheese': ['curds'],
  'eggs': ['egg', 'chicken eggs', 'large eggs', 'whole eggs'],
  'egg substitute': ['egg replacer', 'egg replacement', 'vegan egg'],
  'ghee': ['clarified butter', 'drawn butter'],
  'goat milk': ['goats milk'],
  'half and half': ['half & half', 'half-and-half', 'half n half'],
  'margarine': ['butter substitute', 'vegan butter'],
  'milk': ['whole milk', 'skim milk', 'lowfat milk', '2% milk', 'dairy milk'],
  'powdered milk': ['milk powder', 'dry milk', 'dried milk'],
  'sour cream': ['soured cream', 'cultured cream'],
  'whipped topping': ['cool whip', 'whipped cream', 'non-dairy whipped topping'],
  'yogurt': ['yoghurt', 'plain yogurt', 'greek yogurt'],
  'quail eggs': ['quail egg'],
  'eggnog': ['egg nog', 'holiday eggnog'],

  // ===== CHEESES =====
  'american cheese': ['american singles', 'processed cheese', 'american slices'],
  'asiago cheese': ['asiago'],
  'blue cheese': ['bleu cheese', 'gorgonzola', 'roquefort', 'stilton'],
  'brie': ['brie cheese', 'french brie'],
  'camembert': ['camembert cheese'],
  'cheddar, mild': ['mild cheddar', 'mild cheddar cheese'],
  'cheddar, sharp': ['sharp cheddar', 'sharp cheddar cheese', 'aged cheddar', 'mature cheddar'],
  'colby': ['colby cheese', 'colby jack'],
  'cotija cheese': ['cotija', 'mexican parmesan'],
  'feta': ['feta cheese', 'greek feta'],
  'fontina': ['fontina cheese', 'italian fontina'],
  'fresh mozzarella': ['mozzarella di bufala', 'buffalo mozzarella', 'burrata'],
  'goat cheese': ['chevre', 'chèvre', 'goat'],
  'gorgonzola': ['gorgonzola cheese', 'italian blue cheese'],
  'gouda': ['gouda cheese', 'aged gouda', 'smoked gouda'],
  'gruyere': ['gruyère', 'gruyere cheese', 'swiss gruyere'],
  'halloumi cheese': ['halloumi', 'haloumi', 'grilling cheese'],
  'havarti': ['havarti cheese', 'danish havarti'],
  'manchego cheese': ['manchego', 'spanish manchego'],
  'mascarpone': ['mascarpone cheese', 'italian cream cheese'],
  'monterey jack': ['jack cheese', 'pepper jack'],
  'mozzarella': ['mozzarella cheese', 'pizza cheese', 'low moisture mozzarella'],
  'paneer': ['panir', 'indian cheese', 'indian cottage cheese'],
  'parmesan': ['parmigiano', 'parmigiano reggiano', 'parmesan cheese', 'parm'],
  'provolone': ['provolone cheese'],
  'queso fresco': ['fresh mexican cheese', 'queso blanco'],
  'ricotta': ['ricotta cheese'],
  'romano': ['romano cheese', 'pecorino romano', 'pecorino'],
  'swiss cheese': ['swiss', 'emmental', 'emmentaler', 'baby swiss'],

  // ===== PLANT-BASED MILKS =====
  'almond milk': ['almond beverage', 'unsweetened almond milk'],
  'coconut milk': ['canned coconut milk', 'full fat coconut milk'],
  'coconut milk beverage': ['coconut drink', 'coconut milk carton'],
  'coconut cream': ['cream of coconut', 'thick coconut milk'],
  'coconut water': ['coconut juice'],
  'oat milk': ['oat beverage', 'oatly'],
  'rice milk': ['rice beverage'],
  'soy milk': ['soya milk', 'soymilk'],

  // ===== BEANS & LEGUMES =====
  'black beans': ['black turtle beans', 'frijoles negros'],
  'black-eyed peas': ['black eyed peas', 'cowpeas', 'cow peas'],
  'cannellini beans': ['white kidney beans', 'cannellini'],
  'chickpeas': ['garbanzo beans', 'garbanzos', 'chick peas', 'ceci beans'],
  'cranberry beans': ['borlotti beans', 'roman beans'],
  'fava beans': ['broad beans', 'faba beans'],
  'great northern beans': ['white beans', 'northern beans'],
  'kidney beans': ['red kidney beans', 'rajma'],
  'lima beans': ['butter beans', 'lima'],
  'navy beans': ['haricot beans', 'boston beans', 'white pea beans'],
  'pinto beans': ['pinto', 'frijoles'],
  'refried beans': ['frijoles refritos', 'refried'],
  'split peas': ['yellow split peas', 'green split peas'],
  'white beans': ['great northern', 'cannellini', 'navy beans'],
  'baked beans': ['beans in sauce', 'pork and beans'],
  'black gram': ['urad dal', 'black lentils'],
  'chana dal': ['split chickpeas', 'bengal gram'],
  'urad dal': ['black gram', 'split black gram'],
  'brown lentils': ['brown lentil', 'whole lentils'],
  'green lentils': ['french lentils', 'puy lentils', 'lentilles du puy'],
  'red lentils': ['red lentil', 'masoor dal', 'split red lentils'],
  'beluga lentils': ['black lentils', 'beluga'],

  // ===== NUTS & SEEDS =====
  'almonds': ['almond', 'whole almonds', 'raw almonds', 'sliced almonds', 'slivered almonds'],
  'cashews': ['cashew nuts', 'cashew'],
  'chestnuts': ['chestnut', 'roasted chestnuts'],
  'hazelnuts': ['filberts', 'hazelnut', 'cobnuts'],
  'macadamia nuts': ['macadamias', 'macadamia'],
  'peanuts': ['groundnuts', 'ground nuts', 'peanut'],
  'pecans': ['pecan nuts', 'pecan'],
  'pine nuts': ['pignoli', 'pinon nuts', 'pine kernels'],
  'pistachios': ['pistachio nuts', 'pistachio'],
  'walnuts': ['walnut', 'english walnuts'],
  'chia seeds': ['chia', 'chia seed'],
  'flax seeds': ['flaxseed', 'linseed', 'flax'],
  'hemp seeds': ['hemp hearts', 'hemp seed'],
  'poppy seeds': ['poppy seed', 'khus khus'],
  'pumpkin seeds': ['pepitas', 'pumpkin seed'],
  'sesame seeds': ['sesame seed', 'til', 'benne seeds'],
  'sunflower seeds': ['sunflower seed', 'sunflower kernels'],

  // ===== NUT BUTTERS & SPREADS =====
  'peanut butter': ['peanut spread', 'pb', 'natural peanut butter'],
  'almond butter': ['almond spread'],
  'nut / seed butter': ['nut butter', 'seed butter'],
  'tahini': ['sesame paste', 'sesame butter', 'tehina'],

  // ===== MEAT - BEEF =====
  'beef, ground': ['ground beef', 'minced beef', 'beef mince', 'hamburger meat', 'hamburger'],
  'beef, steak': ['steak', 'beefsteak', 'beef steak'],
  'beef, roast': ['roast beef', 'beef roast'],
  'beef, brisket': ['brisket', 'beef brisket'],
  'beef, chuck roast': ['chuck roast', 'pot roast', 'chuck'],
  'beef, chuck steak': ['chuck steak'],
  'beef, flank steak': ['flank steak', 'flank', 'london broil'],
  'beef, rib roast': ['prime rib', 'standing rib roast', 'rib roast'],
  'beef, rib-eye steak': ['ribeye steak', 'rib eye steak', 'ribeye', 'rib eye', 'delmonico steak'],
  'beef, ribs': ['beef ribs', 'short ribs', 'beef short ribs'],
  'beef, round roast': ['round roast', 'eye of round'],
  'beef, round steak': ['round steak'],
  'beef, sirloin steak': ['sirloin steak', 'sirloin', 'top sirloin'],
  'beef sirloin roast': ['sirloin roast', 'sirloin tip roast'],
  'beef, skirt steak': ['skirt steak', 'fajita meat'],
  'beef, stew meat': ['stew beef', 'beef cubes', 'beef for stew'],
  'beef, strip steak': ['strip steak', 'new york strip', 'ny strip', 'kansas city strip'],
  'beef, tenderloin steak': ['filet mignon', 'tenderloin steak', 'filet'],
  'beef tenderloin roast': ['tenderloin roast', 'beef tenderloin', 'whole tenderloin'],
  'beef. t-bone steak': ['t-bone steak', 'tbone steak', 't bone steak', 'porterhouse'],
  'filet mignon': ['beef tenderloin steak', 'filet', 'fillet mignon'],
  'ground bison': ['bison mince', 'minced bison', 'buffalo meat'],

  // ===== MEAT - PORK =====
  'pork, ground': ['ground pork', 'minced pork', 'pork mince'],
  'pork chops': ['pork chop', 'bone in pork chops', 'center cut pork chops'],
  'pork, loin': ['pork loin', 'pork loin roast'],
  'pork, tenderloin': ['pork tenderloin', 'pork fillet'],
  'pork ribs': ['baby back ribs', 'spare ribs', 'pork spare ribs', 'st louis ribs'],
  'pork shoulder': ['pork butt', 'boston butt', 'pork shoulder roast'],
  'pork belly': ['fresh bacon', 'side pork'],
  'pork sausages': ['pork sausage', 'breakfast sausage', 'italian sausage'],
  'bacon': ['streaky bacon', 'american bacon', 'bacon strips'],
  'bacon fat': ['bacon grease', 'bacon drippings'],
  'ham': ['sliced ham', 'smoked ham', 'deli ham', 'baked ham'],
  'prosciutto': ['parma ham', 'italian ham', 'prosciutto di parma'],
  'pancetta': ['italian bacon', 'pancetta bacon'],

  // ===== MEAT - POULTRY =====
  'chicken': ['whole chicken', 'roasting chicken'],
  'chicken breast': ['chicken breasts', 'boneless chicken', 'boneless skinless chicken breast', 'chicken cutlets'],
  'chicken legs': ['chicken leg', 'drumsticks', 'chicken drumsticks'],
  'chicken, thighs': ['chicken thighs', 'chicken thigh', 'bone in thighs', 'boneless thighs'],
  'chicken wings': ['chicken wing', 'wings', 'buffalo wings'],
  'chicken carcass': ['chicken bones', 'chicken frame'],
  'ground chicken': ['minced chicken', 'chicken mince'],
  'ground turkey': ['minced turkey', 'turkey mince', 'lean ground turkey'],
  'turkey': ['whole turkey', 'roast turkey'],
  'turkey carcass': ['turkey bones', 'turkey frame'],
  'duck': ['whole duck', 'roast duck', 'duck breast'],
  'liver, poultry': ['chicken liver', 'chicken livers', 'duck liver'],
  'poultry sausage': ['chicken sausage', 'turkey sausage'],

  // ===== MEAT - LAMB & OTHER =====
  'lamb, ground': ['ground lamb', 'minced lamb', 'lamb mince'],
  'lamb chops': ['lamb chop', 'lamb loin chops', 'lamb rib chops'],
  'lamb leg': ['leg of lamb', 'lamb leg roast'],
  'lamb rack': ['rack of lamb', 'lamb rib rack'],
  'lamb shanks': ['lamb shank'],
  'lamb shoulder': ['lamb shoulder roast'],
  'lamb, stew meat': ['lamb stew meat', 'lamb cubes'],
  'liver, calf\'s': ['calf liver', 'veal liver'],
  'rabbit & hare': ['rabbit', 'hare'],
  'veal, chops': ['veal chops', 'veal cutlets'],
  'veal, ground': ['ground veal', 'minced veal'],
  'veal, steak': ['veal steak', 'veal scallopini'],
  'venison': ['deer meat', 'deer'],

  // ===== PROCESSED MEATS =====
  'chorizo': ['spanish chorizo', 'mexican chorizo'],
  'hot dogs': ['frankfurters', 'franks', 'wieners', 'hotdogs'],
  'pepperoni': ['pepperoni slices'],
  'pulled pork': ['shredded pork', 'carnitas'],
  'salami': ['salame', 'genoa salami', 'hard salami'],

  // ===== SEAFOOD - FISH =====
  'anchovies': ['anchovy', 'anchovy fillets'],
  'catfish': ['catfish fillets'],
  'cod': ['cod fish', 'atlantic cod', 'pacific cod', 'codfish'],
  'flounder': ['flounder fillets'],
  'grouper': ['grouper fillets'],
  'haddock': ['smoked haddock', 'finnan haddie'],
  'halibut': ['halibut steak', 'halibut fillets'],
  'herring': ['pickled herring', 'kippered herring', 'kippers'],
  'mackerel': ['atlantic mackerel', 'king mackerel'],
  'mahi mahi': ['mahi-mahi', 'dolphinfish', 'dorado'],
  'salmon': ['atlantic salmon', 'wild salmon', 'salmon fillet', 'sockeye salmon'],
  'smoked salmon': ['lox', 'nova', 'nova lox', 'gravlax'],
  'sardines': ['sardine', 'canned sardines'],
  'sea bass': ['seabass', 'branzino', 'chilean sea bass'],
  'snapper': ['red snapper', 'snapper fillets'],
  'sole': ['dover sole', 'lemon sole', 'sole fillets'],
  'striped bass': ['striper', 'rockfish'],
  'swordfish': ['swordfish steak'],
  'tilapia': ['tilapia fillets'],
  'trout': ['rainbow trout', 'trout fillets'],
  'tuna': ['ahi tuna', 'yellowfin tuna', 'tuna steak', 'fresh tuna'],
  'canned tuna': ['tuna fish', 'tuna can', 'chunk light tuna', 'albacore tuna'],

  // ===== SEAFOOD - SHELLFISH =====
  'clams': ['clam', 'littleneck clams', 'cherrystone clams', 'manila clams'],
  'crab': ['crabmeat', 'crab meat', 'lump crab', 'blue crab'],
  'lobster': ['lobster tail', 'lobster meat'],
  'mussels': ['mussel', 'black mussels', 'green mussels'],
  'oysters': ['oyster', 'raw oysters', 'shucked oysters'],
  'scallops': ['scallop', 'sea scallops', 'bay scallops'],
  'shrimp': ['prawns', 'prawn', 'jumbo shrimp', 'tiger shrimp', 'large shrimp'],
  'squid (calamari)': ['calamari', 'squid', 'fried calamari'],
  'octopus': ['tako', 'pulpo'],
  'caviar': ['fish roe', 'roe', 'fish eggs'],

  // ===== PLANT PROTEINS =====
  'tempeh': ['fermented soy', 'tempeh strips'],
  'tofu': ['bean curd', 'soybean curd', 'firm tofu', 'silken tofu', 'soft tofu'],
  'seitan': ['wheat meat', 'wheat gluten'],

  // ===== OILS =====
  'canola oil': ['rapeseed oil', 'vegetable oil'],
  'coconut oil': ['virgin coconut oil'],
  'corn oil': ['maize oil'],
  'grapeseed oil': ['grape seed oil'],
  'olive oil': ['extra virgin olive oil', 'evoo', 'virgin olive oil'],
  'peanut oil': ['groundnut oil'],
  'safflower oil': ['safflower'],
  'sesame oil': ['toasted sesame oil', 'dark sesame oil'],
  'sunflower oil': ['sunflower seed oil'],
  'truffle oil': ['white truffle oil', 'black truffle oil'],
  'vegetable oil': ['cooking oil', 'neutral oil'],
  'nut oil': ['walnut oil', 'hazelnut oil'],
  'chili oil': ['chilli oil', 'hot oil', 'red pepper oil'],

  // ===== VINEGARS =====
  'balsamic vinegar': ['balsamic', 'aged balsamic'],
  'rice vinegar': ['rice wine vinegar', 'seasoned rice vinegar'],
  'sherry vinegar': ['sherry wine vinegar'],
  'vinegar, cider': ['apple cider vinegar', 'cider vinegar', 'acv'],
  'vinegar, malt': ['malt vinegar'],
  'white vinegar': ['distilled vinegar', 'distilled white vinegar'],
  'wine vinegar': ['red wine vinegar', 'white wine vinegar'],

  // ===== SAUCES & CONDIMENTS =====
  'alfredo sauce': ['alfredo', 'white pasta sauce'],
  'barbecue sauce': ['bbq sauce', 'barbeque sauce'],
  'chili garlic sauce': ['chili garlic', 'sambal'],
  'chili sauce (tomato-based)': ['chili sauce', 'heinz chili sauce'],
  'cranberry sauce': ['cranberry jelly', 'cranberry relish'],
  'enchilada sauce': ['red enchilada sauce', 'green enchilada sauce'],
  'fish sauce': ['nam pla', 'nuoc mam', 'patis'],
  'harissa sauce': ['harissa', 'harissa paste'],
  'hoisin sauce': ['hoisin', 'chinese bbq sauce'],
  'horseradish': ['prepared horseradish', 'horseradish sauce', 'wasabi'],
  'hot sauce': ['pepper sauce', 'louisiana hot sauce', 'franks hot sauce'],
  'ketchup': ['catsup', 'tomato ketchup', 'katsup'],
  'marinara sauce': ['marinara', 'pasta sauce', 'red sauce', 'spaghetti sauce'],
  'mayonnaise': ['mayo', 'hellmanns', 'best foods'],
  'oyster sauce': ['oyster flavored sauce'],
  'pesto': ['basil pesto', 'pesto sauce'],
  'pizza sauce': ['pizza topping sauce'],
  'salsa': ['fresh salsa', 'pico de gallo', 'salsa fresca', 'tomato salsa'],
  'sambal oelek': ['sambal', 'indonesian chili paste'],
  'soy sauce / tamari': ['soy sauce', 'tamari', 'shoyu', 'light soy sauce', 'dark soy sauce'],
  'sriracha': ['sriracha sauce', 'rooster sauce', 'hot chili sauce'],
  'steak sauce': ['a1 sauce', 'a1', 'hp sauce'],
  'sweet chili sauce': ['sweet chilli sauce', 'thai sweet chili'],
  'tabasco': ['tabasco sauce', 'hot pepper sauce'],
  'taco sauce': ['taco hot sauce'],
  'teriyaki sauce': ['teriyaki', 'teriyaki glaze', 'teriyaki marinade'],
  'tomato paste': ['tomato puree', 'tomato concentrate', 'double concentrated tomato'],
  'tomato sauce': ['tomato puree', 'passata'],
  'worcestershire sauce': ['worcestershire', 'lea and perrins', 'lea & perrins'],

  // ===== MUSTARDS =====
  'dijon mustard': ['dijon', 'french mustard'],
  'dry mustard': ['mustard powder', 'ground mustard', 'colemans mustard'],
  'whole-grain mustard': ['wholegrain mustard', 'stone ground mustard', 'coarse mustard'],
  'yellow mustard': ['american mustard', 'ballpark mustard', 'prepared mustard'],

  // ===== DRESSINGS =====
  'blue cheese dressing': ['bleu cheese dressing'],
  'caesar dressing': ['caesar salad dressing'],
  'italian dressing': ['italian salad dressing', 'zesty italian'],
  'ranch dressing': ['ranch', 'hidden valley ranch'],
  'salad dressing': ['vinaigrette', 'house dressing'],

  // ===== CANNED & JARRED =====
  'canned tomatoes': ['diced tomatoes', 'crushed tomatoes', 'whole tomatoes', 'tinned tomatoes'],
  'grape leaves': ['vine leaves', 'dolma leaves'],
  'hummus': ['houmous', 'humous', 'chickpea dip'],
  'guacamole': ['guac', 'avocado dip'],
  'olives, black': ['black olives', 'ripe olives'],
  'olives, green': ['green olives', 'manzanilla olives'],
  'olives, kalamata': ['kalamata olives', 'greek olives'],
  'relish': ['pickle relish', 'sweet relish'],
  'dill pickles': ['dill pickle', 'kosher dill', 'pickled cucumber'],
  'capers': ['caper berries', 'caperberries'],
  'sauerkraut': ['sour kraut', 'fermented cabbage'],
  'kimchi': ['kimchee', 'korean pickled cabbage'],

  // ===== PASTES & CONCENTRATES =====
  'chipotle in adobo sauce': ['chipotles in adobo', 'chipotle peppers', 'chipotle paste'],
  'curry paste': ['thai curry paste', 'red curry paste', 'green curry paste', 'yellow curry paste'],
  'miso': ['miso paste', 'white miso', 'red miso', 'shiro miso'],
  'tamarind': ['tamarind paste', 'tamarind concentrate'],

  // ===== BROTHS & STOCKS =====
  'broth, beef': ['beef broth', 'beef stock', 'beef bouillon'],
  'broth, chicken': ['chicken broth', 'chicken stock', 'chicken bouillon'],
  'broth, vegetables': ['vegetable broth', 'vegetable stock', 'veggie broth'],
  'clam juice': ['clam broth'],
  'fish stock': ['fish broth', 'dashi'],
  'shellfish stock': ['seafood stock', 'shrimp stock'],

  // ===== SOUPS =====
  'cream of celery soup': ['celery soup', 'condensed celery soup'],
  'cream of chicken soup': ['chicken soup', 'condensed chicken soup'],
  'cream of mushroom soup': ['mushroom soup', 'condensed mushroom soup'],
  'dry soup mix': ['onion soup mix', 'lipton onion soup'],
  'tomato soup': ['condensed tomato soup'],

  // ===== BAKING =====
  'almond bark': ['candy coating', 'chocolate bark'],
  'almond extract': ['almond flavoring'],
  'baking chips': ['chocolate chips', 'morsels', 'baking morsels'],
  'baking mix': ['bisquick', 'biscuit mix', 'pancake mix'],
  'baking powder': ['leavening'],
  'baking soda': ['bicarbonate of soda', 'bicarb', 'sodium bicarbonate'],
  'candied ginger': ['crystallized ginger', 'preserved ginger'],
  'chocolate': ['baking chocolate', 'unsweetened chocolate', 'semisweet chocolate', 'dark chocolate', 'milk chocolate'],
  'chocolate, white': ['white chocolate', 'white baking chocolate'],
  'cocoa powder': ['cocoa', 'unsweetened cocoa', 'dutch process cocoa', 'cacao powder'],
  'cream of tartar': ['potassium bitartrate'],
  'dry yeast': ['active dry yeast', 'instant yeast', 'rapid rise yeast', 'bread yeast'],
  'flavor extracts': ['extracts', 'flavoring'],
  'food coloring': ['food dye', 'food colour', 'gel food coloring'],
  'frosting': ['icing', 'buttercream', 'cake frosting'],
  'gelatin': ['gelatine', 'unflavored gelatin', 'knox gelatin'],
  'marshmallow': ['marshmallows', 'mini marshmallows', 'large marshmallows'],
  'matzo meal': ['matzah meal', 'matza meal'],
  'pectin': ['fruit pectin', 'sure jell'],
  'pie filling': ['canned pie filling', 'cherry pie filling', 'apple pie filling'],
  'sprinkles': ['jimmies', 'nonpareils', 'sugar sprinkles', 'rainbow sprinkles'],
  'vanilla beans': ['vanilla bean', 'vanilla pod'],
  'vanilla extract': ['vanilla', 'pure vanilla extract', 'vanilla essence'],
  'xanthan gum': ['xanthan'],
  'guar gum': ['guar'],

  // ===== SWEETENED GOODS =====
  'apple butter': ['apple spread'],
  'applesauce': ['apple sauce', 'apple puree'],
  'caramel': ['caramel sauce', 'caramel topping', 'dulce de leche'],
  'jam': ['preserves', 'fruit jam'],
  'jelly': ['fruit jelly', 'grape jelly'],
  'marmalade': ['orange marmalade', 'citrus marmalade'],
  'pumpkin puree': ['canned pumpkin', 'pumpkin pulp'],
  'toffee': ['english toffee', 'heath bar'],
  'candies': ['candy', 'sweets'],
  'peppermint candies': ['peppermint candy', 'candy canes', 'peppermint'],

  // ===== BEVERAGES (NON-ALCOHOLIC) =====
  'apple juice / cider': ['apple juice', 'apple cider', 'fresh cider'],
  'club soda': ['soda water', 'sparkling water', 'seltzer'],
  'coffee / coffee beans': ['coffee', 'coffee beans', 'espresso', 'ground coffee'],
  'cranberry juice': ['cranberry juice cocktail', 'cran juice'],
  'ginger ale': ['ginger beer', 'ginger soda'],
  'ginger beer': ['jamaican ginger beer', 'alcoholic ginger beer'],
  'grenadine': ['pomegranate syrup'],
  'lemonade': ['fresh lemonade', 'lemon drink'],
  'limeade': ['lime drink', 'fresh limeade'],
  'orange juice': ['oj', 'fresh squeezed orange juice', 'fresh orange juice'],
  'pineapple juice': ['pineapple'],
  'pomegranate juice': ['pom juice', 'pomegranate'],
  'root beer': ['rootbeer', 'sarsaparilla'],
  'soda, cola': ['cola', 'coke', 'pepsi', 'coca cola'],
  'soda, lemon-lime': ['sprite', '7up', 'seven up', 'lemon lime soda'],
  'sparkling water': ['seltzer', 'fizzy water', 'carbonated water'],
  'tea': ['black tea', 'green tea', 'herbal tea', 'iced tea'],
  'tonic water': ['tonic', 'quinine water'],
  'tomato juice': ['v8', 'vegetable juice'],
  'vegetable juice': ['v8', 'tomato vegetable juice'],
  'water': ['h2o', 'tap water', 'filtered water'],
  'chamomile': ['chamomile tea', 'camomile'],
  'matcha powder': ['matcha', 'green tea powder'],

  // ===== ALCOHOLIC BEVERAGES - WINE =====
  'cabernet sauvignon': ['cabernet', 'cab sav', 'cab'],
  'chardonnay': ['chard', 'white burgundy'],
  'madeira': ['madeira wine'],
  'marsala wine': ['marsala', 'cooking marsala'],
  'merlot': ['red merlot'],
  'pinot noir': ['pinot', 'red burgundy'],
  'port wine': ['port', 'porto'],
  'red wine': ['dry red wine', 'red table wine'],
  'riesling': ['white riesling'],
  'sake / rice wine': ['sake', 'rice wine', 'nihonshu', 'japanese rice wine'],
  'sauvignon blanc': ['sauv blanc', 'fumé blanc'],
  'sherry wine': ['sherry', 'cooking sherry', 'dry sherry'],
  'sparkling wine': ['champagne', 'prosecco', 'cava', 'bubbly'],
  'white wine': ['dry white wine', 'white table wine'],
  'zinfandel': ['zin', 'white zinfandel'],

  // ===== ALCOHOLIC BEVERAGES - SPIRITS =====
  'bourbon': ['bourbon whiskey', 'kentucky bourbon'],
  'brandy': ['grape brandy', 'cognac'],
  'cognac': ['french brandy', 'vs cognac', 'vsop cognac'],
  'gin': ['london dry gin', 'dry gin'],
  'rum': ['white rum', 'dark rum', 'spiced rum', 'gold rum'],
  'tequila': ['silver tequila', 'blanco tequila', 'reposado', 'anejo'],
  'vodka': ['plain vodka'],
  'whiskey': ['whisky', 'scotch', 'rye whiskey', 'irish whiskey'],
  'vermouth, dry': ['dry vermouth', 'white vermouth', 'french vermouth'],
  'vermouth, sweet': ['sweet vermouth', 'red vermouth', 'italian vermouth'],

  // ===== ALCOHOLIC BEVERAGES - BEER =====
  'beer, ale': ['ale', 'pale ale', 'ipa', 'india pale ale'],
  'beer, brown ale': ['brown ale', 'nut brown ale', 'english brown'],
  'beer, lager': ['lager', 'pilsner', 'pils'],
  'beer, stout': ['stout', 'guinness', 'porter', 'dark beer'],
  'beer, white ale': ['white ale', 'witbier', 'wheat beer', 'hefeweizen'],
  'hard cider': ['cider', 'apple cider alcoholic'],

  // ===== ALCOHOLIC BEVERAGES - LIQUEURS =====
  'amaretto': ['almond liqueur', 'amaretto liqueur'],
  'anise liquor': ['anisette', 'pastis', 'ouzo', 'sambuca', 'arak'],
  'bitters': ['angostura bitters', 'aromatic bitters', 'orange bitters'],
  'blue curacao': ['blue curacao liqueur', 'curacao'],
  'campari': ['italian bitter'],
  'chocolate liqueur': ['creme de cacao', 'godiva liqueur'],
  'coffee liqueur': ['kahlua', 'tia maria'],
  'creme liqueur': ['baileys', 'irish cream', 'cream liqueur'],
  'fruit liqueur': ['schnapps', 'peach schnapps', 'raspberry liqueur'],
  'hazelnut liqueur': ['frangelico', 'nut liqueur'],
  'jagermeister': ['jager', 'herbal liqueur'],
  'lemon liqueur': ['limoncello', 'lemon liqueur'],
  'orange liqueur': ['triple sec', 'cointreau', 'grand marnier', 'curacao'],
  'schnapps': ['peppermint schnapps', 'butterscotch schnapps'],
  'southern comfort': ['soco', 'whiskey liqueur'],

  // ===== MISC =====
  'alfalfa sprouts': ['sprouts', 'alfalfa'],
  'essential oil': ['aromatherapy oil', 'food grade essential oil'],
  'ice': ['ice cubes', 'crushed ice'],
  'ice cream': ['icecream', 'gelato', 'frozen dessert'],
  'liquid smoke': ['smoke flavoring', 'hickory liquid smoke'],
  'lard': ['pork fat', 'rendered pork fat'],
  'maraschino cherries': ['cocktail cherries', 'maraschino'],
  'malt': ['malted milk', 'malt powder'],
  'masa harina': ['masa', 'corn masa', 'instant corn masa'],
  'non-dairy creamer': ['coffee creamer', 'creamer'],
  'nutrional yeast': ['nutritional yeast', 'nooch', 'brewers yeast'],
  'orange flower water': ['orange blossom water'],
  'popcorn': ['popping corn', 'popcorn kernels'],
  'potato chips': ['crisps', 'chips'],
  'pudding': ['pudding mix', 'instant pudding'],
  'rose water': ['rosewater', 'rose essence'],
  'salt': ['sea salt', 'kosher salt', 'table salt', 'fine salt', 'coarse salt'],
  'shortening': ['crisco', 'vegetable shortening'],
  'cookie dough': ['refrigerated cookie dough', 'store bought cookie dough'],
  'wasabi': ['japanese horseradish', 'wasabi paste'],
  'whey protein powder': ['whey protein', 'protein powder'],
  'granola': ['granola cereal', 'homemade granola'],
  'corn flakes cereals': ['corn flakes', 'cornflakes', 'frosted flakes'],
  'rice cereals': ['rice krispies', 'puffed rice', 'rice cereal'],
  'hominy': ['posole', 'pozole', 'nixtamalized corn'],
  'wheat bran': ['bran', 'millers bran'],
  'wheat germ': ['toasted wheat germ'],
  'oat bran': ['oat fiber'],
};

// Build reverse lookup: alternative name -> canonical name
const SYNONYM_TO_CANONICAL: Map<string, string> = new Map();
for (const [canonical, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
  for (const synonym of synonyms) {
    SYNONYM_TO_CANONICAL.set(synonym.toLowerCase(), canonical.toLowerCase());
  }
}

interface SearchableIngredient extends FoodComboIngredient {
  searchTerms: string; // Combined searchable text
}

let fuseInstance: Fuse<SearchableIngredient> | null = null;
let ingredientsCache: FoodComboIngredient[] = [];

/**
 * Initialize the search index with ingredients
 */
export function initializeSearch(ingredients: FoodComboIngredient[]): void {
  ingredientsCache = ingredients;

  // Enhance ingredients with search terms including synonyms
  const searchableIngredients: SearchableIngredient[] = ingredients.map(ing => {
    const nameLower = ing.name.toLowerCase();
    const synonymsForThis = INGREDIENT_SYNONYMS[nameLower] || [];

    return {
      ...ing,
      searchTerms: [ing.name, ing.category, ...synonymsForThis].join(' '),
    };
  });

  fuseInstance = new Fuse(searchableIngredients, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'searchTerms', weight: 0.3 },
      { name: 'category', weight: 0.2 },
    ],
    threshold: 0.4, // 0 = exact match, 1 = match anything
    ignoreLocation: true, // Don't care where in the string the match is
    includeScore: true,
    minMatchCharLength: 1,
  });
}

/**
 * Calculate match score for an ingredient name against a query
 * Lower score = better match
 *
 * Priority (best to worst):
 * 0.00 - Name starts with query (e.g., "oat" → "Oat Bran")
 * 0.05 - A word in name starts with query (e.g., "oat" → "Steel Cut Oats")
 * 0.10 - Query matches a complete word (e.g., "oat" → "Oat" in "Oat Bran")
 * 0.15 - Synonym match
 * 0.30 - Query is substring but not at word boundary (e.g., "oat" → "Goat Cheese")
 * null - No match
 */
function calculateMatchScore(query: string, name: string): number | null {
  const queryLower = query.toLowerCase();
  const nameLower = name.toLowerCase();

  // Split name into words for word-boundary checks
  const nameWords = nameLower.split(/[\s,\/\-]+/);

  // Check if name starts with query
  if (nameLower.startsWith(queryLower)) {
    return 0.00;
  }

  // Check if any word in name starts with query
  if (nameWords.some(word => word.startsWith(queryLower))) {
    return 0.05;
  }

  // Check if query matches a complete word
  if (nameWords.includes(queryLower)) {
    return 0.10;
  }

  // Check for multi-word query - all tokens must match at word boundaries
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 0);
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every(token =>
      nameWords.some(word => word.startsWith(token) || word === token)
    );
    if (allTokensMatch) {
      return 0.08;
    }
  }

  // Check if query appears as substring (but not at word boundary)
  // This is lowest priority - catches "oat" in "goat"
  if (nameLower.includes(queryLower)) {
    return 0.30;
  }

  return null; // No match
}

/**
 * Search ingredients with smart matching
 * - Word-boundary aware scoring (prioritizes "Oat Bran" over "Goat Cheese" for "oat")
 * - Synonym support
 * - Fuzzy matching for typos
 */
export function searchIngredients(
  query: string,
  limit: number = 12
): FoodComboIngredient[] {
  if (!query || query.length < 1) return [];

  const queryLower = query.toLowerCase().trim();

  // Check if query matches a synonym
  const canonicalFromSynonym = SYNONYM_TO_CANONICAL.get(queryLower);

  const results: Array<{ item: FoodComboIngredient; score: number }> = [];
  const seenSlugs = new Set<string>();

  // Pass 1: Score-based matching with word boundary awareness
  for (const ing of ingredientsCache) {
    const score = calculateMatchScore(queryLower, ing.name);

    if (score !== null && !seenSlugs.has(ing.slug)) {
      results.push({ item: ing, score });
      seenSlugs.add(ing.slug);
    }
    // Match via synonym lookup
    else if (canonicalFromSynonym && !seenSlugs.has(ing.slug)) {
      const synonymScore = calculateMatchScore(canonicalFromSynonym, ing.name);
      if (synonymScore !== null) {
        results.push({ item: ing, score: 0.15 + synonymScore });
        seenSlugs.add(ing.slug);
      }
    }
  }

  // Pass 2: Fuzzy search with Fuse.js (for typos and partial matches)
  if (fuseInstance && results.length < limit) {
    const fuseResults = fuseInstance.search(query, { limit: limit * 2 });

    for (const result of fuseResults) {
      if (!seenSlugs.has(result.item.slug)) {
        results.push({
          item: result.item,
          score: result.score ?? 0.5
        });
        seenSlugs.add(result.item.slug);
      }
    }
  }

  // Sort by score (lower is better) and return top results
  results.sort((a, b) => a.score - b.score);

  return results.slice(0, limit).map(r => r.item);
}

/**
 * Get suggested synonyms for display when no exact match found
 */
export function getSynonymSuggestion(query: string): string | null {
  const queryLower = query.toLowerCase().trim();
  const canonical = SYNONYM_TO_CANONICAL.get(queryLower);

  if (canonical) {
    // Find the actual ingredient name (properly cased)
    const match = ingredientsCache.find(
      ing => ing.name.toLowerCase() === canonical
    );
    return match?.name ?? null;
  }

  return null;
}
