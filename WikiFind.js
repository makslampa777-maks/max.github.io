(function () {
    'use strict';

    function WikiSmartPlugin() {
        var ICON_WIKI = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M416 32h-64c-17.67 0-32 14.33-32 32s14.33 32 32 32h64c17.67 0 32 14.33 32 32v256c0 17.67-14.33 32-32 32h-64c-17.67 0-32 14.33-32 32s14.33 32 32 32h64c53.02 0 96-42.98 96-96V128c0-53.02-42.98-96-96-96zM160 32h-64C42.98 32 0 75.02 0 128v256c0 53.02 42.98 96 96 96h64c17.67 0 32-14.33 32-32s-14.33-32-32-32h-64c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h64c17.67 0 32-14.33 32-32s-14.33-32-32-32zM256 160c-17.67 0-32 14.33-32 32v128c0 17.67 14.33 32 32 32s32-14.33 32-32V192c0-17.67-14.33-32-32-32z"/></svg>';
        var isOpened = false;

        this.init = function () {
            var _this = this;
            Lampa.Listener.follow('full', function (e) {
                if (e.type === 'complite') {
                    _this.cleanup();
                    setTimeout(function() {
                        try {
                            _this.render(e.data, e.object.activity.render());
                        } catch (err) {}
                    }, 200);
                }
            });
        };

        this.cleanup = function() {
            $('.lampa-wiki-button').remove();
            $('.wiki-select-container, .wiki-viewer-container').remove();
            isOpened = false;
        };

        this.render = function (data, html) {
            var _this = this;
            var container = $(html);
            if (container.find('.lampa-wiki-button').length) return;

            var button = $('<div class="full-start__button selector lampa-wiki-button">' +
                                ICON_WIKI +
                                '<span>Wiki</span>' +
                            '</div>');

            var style = '<style>' +
                '.lampa-wiki-button { display: flex !important; align-items: center; justify-content: center; } ' +
                '.lampa-wiki-button svg { width: 1.6em; height: 1.6em; margin-right: 5px; } ' +
                '.wiki-select-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); z-index: 2000; display: flex; align-items: center; justify-content: center; }' +
                '.wiki-select-body { position: relative; width: 70%; max-width: 600px; background: #1a1a1a; border-radius: 10px; padding: 25px; border: 1px solid #333; }' +
                '.wiki-item { padding: 15px; margin: 10px 0; background: rgba(255,255,255,0.05); border-radius: 5px; cursor: pointer; border: 2px solid transparent; display: flex; align-items: center; gap: 10px; }' +
                '.wiki-item.focus { border-color: #fff; background: rgba(255,255,255,0.1); outline: none; }' +
                '.wiki-item__lang { font-size: 1.2em; }' +
                '.wiki-item__title { font-size: 1.1em; color: #fff; }' +
                '.wiki-viewer-container { position: fixed; top: 5%; left: 5%; width: 90%; height: 90%; background: #fff; z-index: 2001; border-radius: 10px; overflow: hidden; box-shadow: 0 0 30px rgba(0,0,0,0.7); }' +
                '.wiki-close-btn { position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; background: #ff4444; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2005; font-size: 14px; font-weight: bold; border: 1px solid #fff; line-height: 1; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }' +
                '.wiki-close-btn.focus { background: #fff !important; color: #ff4444 !important; border-color: #ff4444 !important; transform: scale(1.1); }' +
                '.wiki-menu-close { position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; background: #ff4444; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2003; font-size: 12px; font-weight: bold; border: 1px solid #fff; line-height: 1; box-shadow: 0 0 10px rgba(0,0,0,0.5); transition: all 0.2s; }' +
                '.wiki-menu-close.focus { background: #fff; color: #ff4444; border-color: #ff4444; transform: scale(1.1); }' +
                '</style>';

            if (!$('style#wiki-plugin-style').length) $('head').append('<style id="wiki-plugin-style">' + style + '</style>');

            var buttons_container = container.find('.full-start-new__buttons, .full-start__buttons');
            var neighbors = buttons_container.find('.selector');
            
            if (neighbors.length >= 2) {
                button.insertAfter(neighbors.eq(1));
            } else {
                buttons_container.append(button);
            }

            button.on('hover:enter click', function() {
                if (!isOpened) _this.startSearch(data.movie);
            });

            if (Lampa.Controller.enabled().name === 'full_start') {
                Lampa.Controller.enable('full_start');
            }
        };

        this.startSearch = function (movie) {
            var _this = this;
            if (!movie) return;
            var current_controller = Lampa.Controller.enabled().name;
            isOpened = true;
            
            // Создаем временный лоадер
            var loader = $('<div class="wiki-loader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 3000; display: flex; align-items: center; justify-content: center;"><div style="color: #fff; font-size: 1.5em; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; border: 1px solid #fff;">Поиск в Wikipedia...</div></div>');
            $('body').append(loader);

            var year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
            var isTV = !!(movie.first_air_date || movie.number_of_seasons || movie.seasons);
            var isAnimation = (movie.genres || []).some(function(g) { return g.id === 16 || (g.name && g.name.toLowerCase().indexOf('анимац') !== -1) || (g.name && g.name.toLowerCase().indexOf('мульт') !== -1); }) || 
                             (movie.genre_ids || []).indexOf(16) !== -1;
            
            var clean = function(str) {
                if (!str) return '';
                // Сохраняем буквы, цифры, пробелы, апострофы и дефисы
                return str.replace(/[^'’\-\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
            };

            var normalize = function(str) {
                if (!str) return '';
                // Полная очистка для сравнения: только буквы и цифры
                return str.toLowerCase().replace(/[^'’\-\p{L}\p{N}]/gu, '').replace(/['’\-]/g, '');
            };

            var titleRU = clean(movie.title || movie.name);
            var titleEN = clean(movie.original_title || movie.original_name) || titleRU;
            var titleUA = clean(movie.title || movie.name);

            var queries = [
                { lang: 'ru', title: titleRU, suffix: isTV ? 'сериал' : (isAnimation ? 'мультфильм' : 'фильм'), icon: '🇷🇺', priority: 1 },
                { lang: 'uk', title: titleUA, suffix: isTV ? 'серіал' : (isAnimation ? 'мультфільм' : 'фільм'), icon: '🇺🇦', priority: 2 },
                { lang: 'en', title: titleEN, suffix: isTV ? 'series' : (isAnimation ? 'animation' : 'film'), icon: '🇺🇸', priority: 3 }
            ];

            // Дополнительный поиск: русское название в английской википедии
            if (titleRU && titleRU !== titleEN) {
                queries.push({ lang: 'en', title: titleRU, suffix: isTV ? 'series' : (isAnimation ? 'animation' : 'film'), icon: '🇺🇸', priority: 4 });
            }
            
            // Пытаемся найти английское название в данных TMDB (Lampa часто прокидывает альтернативные названия)
            if (movie.alternative_titles && movie.alternative_titles.titles) {
                var en_alt = movie.alternative_titles.titles.find(function(t) { return t.iso_3166_1 === 'US' || t.iso_3166_1 === 'GB'; });
                if (en_alt) {
                    var altEN = clean(en_alt.title);
                    if (altEN && altEN !== titleEN) {
                        queries.push({ lang: 'en', title: altEN, suffix: isTV ? 'series' : (isAnimation ? 'animation' : 'film'), icon: '🇺🇸', priority: 0 }); // Высший приоритет
                    }
                }
            }

            var results = [];
            var promises = queries.map(function(q) {
                if (!q.title) return $.Deferred().resolve();

                var searchTerm = q.title + ' ' + (year ? year + ' ' : '') + q.suffix;
                
                return $.ajax({
                    url: 'https://' + q.lang + '.wikipedia.org/w/api.php',
                    data: {
                        action: 'query',
                        list: 'search',
                        srsearch: searchTerm,
                        srlimit: 10,
                        srprop: 'snippet',
                        format: 'json',
                        origin: '*'
                    },
                    dataType: 'json'
                }).then(function(res) {
                    if (res.query && res.query.search) {
                        res.query.search.forEach(function(item) {
                            var score = 0;
                            var lowerTitle = item.title.toLowerCase();
                            var searchTitle = q.title.toLowerCase();
                            var normTitle = normalize(item.title);
                            var normSearch = normalize(q.title);
                            var snippet = (item.snippet || '').toLowerCase();

                            // Ранжирование для точности
                            var cleanTitle = item.title.replace(/\s\(.*\)$/, ''); // "The Rip (film)" -> "The Rip"
                            var normCleanTitle = normalize(cleanTitle);

                            if (normCleanTitle === normSearch) score += 100; // Огромный бонус за точное совпадение названия (игнорируя суффикс в скобках)
                            else if (normTitle.indexOf(normSearch) !== -1) score += 10;
                            
                            var hasSearchInTitle = lowerTitle.indexOf(searchTitle) !== -1 || normTitle.indexOf(normSearch) !== -1;
                            if (!hasSearchInTitle) score -= 70; // Сильный штраф, если в заголовке вообще нет искомого слова (значит это просто упоминание в тексте)
                            
                            var hasYearInTitle = year && lowerTitle.indexOf(year.toString()) !== -1;
                            var hasYearInSnippet = year && snippet.indexOf(year.toString()) !== -1;

                            // Проверка года с допуском ±1 год
                            var movieYear = parseInt(year);
                            if (movieYear) {
                                if (hasYearInTitle) {
                                    score += 50; // Огромный бонус за год в заголовке
                                } else if (hasYearInSnippet) {
                                    score += 20;
                                } else if (lowerTitle.indexOf((movieYear - 1).toString()) !== -1 || snippet.indexOf((movieYear - 1).toString()) !== -1) {
                                    score += 10;
                                } else if (lowerTitle.indexOf((movieYear + 1).toString()) !== -1 || snippet.indexOf((movieYear + 1).toString()) !== -1) {
                                    score += 10;
                                }
                            }

                            if (lowerTitle.indexOf(q.suffix) !== -1) score += 15;
                            if (normTitle === normSearch) score += 10;
                            
                            // Википедия часто использует скобки: "Название (фильм, 2024)"
                            if (lowerTitle.indexOf('(') !== -1 && lowerTitle.indexOf(')') !== -1) {
                                if (lowerTitle.indexOf(q.suffix) !== -1) score += 10;
                                if (hasYearInTitle) score += 20; // Дополнительный бонус за год в скобках
                            }

                            // --- Улучшенная фильтрация ---
                            var hasSuffix = lowerTitle.indexOf(q.suffix) !== -1 || snippet.indexOf(q.suffix) !== -1;
                            var hasTitle = normTitle.indexOf(normSearch) !== -1;

                            // 1. Исключаем "мусорные" слова
                            var blacklist = [
                               'год в кино', 'рік у кіно', 'in film', 'in television', 
                               'список', 'list of', 'фильмография', 'фільмографія', 'filmography',
                               '(значения)', '(значення)', '(disambiguation)'
                            ];
                            
                            // Если ищем фильм/сериал, то книги и персонажи - низкий приоритет
                            var lowPriority = [
                               '(книга)', '(роман)', '(повість)', '(повесть)', '(комикс)', '(комікс)',
                               '(персонаж)', '(саундтрек)', '(альбом)', '(пісня)', '(песня)',
                               '(book)', '(novel)', '(comics)', '(character)', '(soundtrack)', '(album)', '(song)'
                            ];

                            var isDisambiguation = snippet.indexOf('may refer to') !== -1 || 
                                                  snippet.indexOf('может означать') !== -1 || 
                                                  snippet.indexOf('може означати') !== -1 ||
                                                  snippet.indexOf('disambiguation page') !== -1 ||
                                                  lowerTitle.indexOf('(disambiguation)') !== -1;

                            // Если заголовок в точности равен поисковому запросу без (фильм/год), 
                            // и в сниппете есть признаки списка (may refer to), то это страница неоднозначности.
                            // В противном случае - это ПРЯМАЯ ссылка на основную статью (как Marty Supreme).
                            var exactMatch = lowerTitle === searchTitle;
                            if (exactMatch && isDisambiguation) {
                                score -= 150; 
                            } else if (exactMatch) {
                                score += 80; // Дополнительный бонус за идеально чистый заголовок
                            }

                            var isTrash = blacklist.some(function(word) { return lowerTitle.indexOf(word) !== -1; }) || (exactMatch && isDisambiguation);
                            
                            if (isDisambiguation && !exactMatch) {
                                score -= 150; 
                            }

                            var isLowPriority = lowPriority.some(function(word) { return lowerTitle.indexOf(word) !== -1; });
                            if (isLowPriority) score -= 40;

                            // Детекция биографий (если ищем фильм)
                            var isBiography = (snippet.indexOf(' is a ') !== -1 || snippet.indexOf(' was an ') !== -1 || 
                                             snippet.indexOf(' born ') !== -1 || snippet.indexOf(' director ') !== -1 ||
                                             snippet.indexOf(' actor ') !== -1 || snippet.indexOf(' — ') !== -1) && 
                                             !hasSuffix && !hasYearInTitle;
                            if (isBiography) score -= 50;

                            if (lowerTitle.indexOf('soundtrack') !== -1 && q.suffix !== 'soundtrack') score -= 100; // Увеличен штраф для саундтреков
                            if (lowerTitle.indexOf('album') !== -1 && q.suffix !== 'album') score -= 100; // Штраф для альбомов
                            if (lowerTitle.indexOf('song') !== -1 && q.suffix !== 'song') score -= 100; // Штраф для песен
                            if (lowerTitle.indexOf('score') !== -1 && lowerTitle.indexOf('film') === -1) score -= 50; // Штраф для музыки (score)

                            // 2. Если в заголовке есть другой год (4 цифры), который не совпадает с нашим
                            var yearMatch = lowerTitle.match(/\d{4}/);
                            var wrongYear = yearMatch && year && yearMatch[0] !== year;

                            // 3. Условие допуска:
                            if (!isTrash && !wrongYear) {
                                var hasSearchInSnippet = snippet.indexOf(searchTitle) !== -1 || snippet.indexOf(normSearch) !== -1;
                                var canAdd = false;
                                
                                // ЖЕСТКАЯ ПРОВЕРКА: название статьи должно содержать хотя бы одно слово из поискового запроса.
                                // Это исключит случайные результаты вроде "Nuremberg" при поиске "Hamnet", 
                                // которые попали в выдачу только из-за совпадения года и суффикса в тексте.
                                var searchWords = normSearch.split(/\s+/).filter(function(w) { return w.length > 2; });
                                var titleHasAnyWord = searchWords.some(function(word) { return normCleanTitle.indexOf(word) !== -1; });

                                if (!titleHasAnyWord && normCleanTitle !== '') {
                                    canAdd = false;
                                }
                                // Приоритет 1: Есть год в заголовке - добавляем почти всегда
                                else if (hasYearInTitle && (hasTitle || hasSearchInSnippet)) {
                                    canAdd = true;
                                } 
                                // Приоритет 2: Совпало название и есть суффикс/год
                                else if (hasTitle && (hasYearInSnippet || hasSuffix || !yearMatch)) {
                                    canAdd = true;
                                }
                                // Приоритет 3: Поиск в сниппете (только если есть и год и суффикс)
                                else if (hasSearchInSnippet && hasYearInSnippet && hasSuffix) {
                                    score += 20;
                                    canAdd = true;
                                }

                                if (canAdd) {
                                    results.push({
                                        title: item.title,
                                        lang: q.icon,
                                        url: 'https://' + q.lang + '.m.wikipedia.org/wiki/' + encodeURIComponent(item.title),
                                        score: score,
                                        langPriority: q.priority,
                                        hasYear: hasYearInTitle || hasYearInSnippet
                                    });
                                }
                            }
                        });
                    }
                });
            });

             $.when.apply($, promises).done(function () {
                 loader.remove();
                 // Сортируем по релевантности и убираем дубли
                 var uniqueResults = [];
                 var seenUrls = {};
                 
                 if (results.length > 0) {
                     // Группируем результаты по языкам
                     var groupedByLang = {};
                     results.forEach(function(r) {
                         if (!groupedByLang[r.lang]) groupedByLang[r.lang] = [];
                         groupedByLang[r.lang].push(r);
                     });

                     var finalResults = [];
                     Object.keys(groupedByLang).forEach(function(lang) {
                         var langResults = groupedByLang[lang];
                         
                         // Если в рамках одного языка есть результат с годом в заголовке,
                         // удаляем все результаты этого языка БЕЗ года в заголовке
                         var hasExactYearInTitle = langResults.some(function(r) { 
                             return r.title.indexOf('(') !== -1 && r.hasYear; 
                         });

                         if (hasExactYearInTitle) {
                             langResults = langResults.filter(function(r) {
                                 return r.title.indexOf('(') !== -1 && r.hasYear;
                             });
                         }

                         finalResults = finalResults.concat(langResults);
                     });

                     results = finalResults;
                 }

                 // Сначала по приоритету языка, потом по счету (релевантности)
                 results.sort(function(a, b) { 
                     if (a.langPriority !== b.langPriority) return a.langPriority - b.langPriority;
                     return b.score - a.score; 
                 });
                 
                 results.forEach(function(item) {
                     if (!seenUrls[item.url]) {
                         // Если в этом языке уже есть результат С ГОДОМ, 
                         // то результаты без года (для того же языка) мы игнорируем как лишние
                         var hasBetterInLang = item.hasYear === false && uniqueResults.some(function(r) { 
                             return r.lang === item.lang && r.hasYear === true; 
                         });

                         if (!hasBetterInLang) {
                             uniqueResults.push(item);
                             seenUrls[item.url] = true;
                         }
                     }
                 });

                var finalResults = uniqueResults.filter(function(r) { return r.score >= 10; });

                if (finalResults.length === 0) {
                    Lampa.Noty.show('Ничего не найдено');
                    isOpened = false;
                    return;
                }

                // Умное открытие: если результат один и очень точный, открываем сразу
                 if (finalResults.length === 1 && finalResults[0].score >= 30) {
                     _this.openIframe(finalResults[0].url, finalResults[0].title, current_controller);
                 } else {
                     _this.showMenu(finalResults, current_controller);
                 }
             }).fail(function() {
                 loader.remove();
                 Lampa.Noty.show('Ошибка поиска');
                 isOpened = false;
             });
        };

        this.showMenu = function(items, movieTitle) {
            var _this = this;
            var current_controller = Lampa.Controller.enabled().name;
            var menu = $('<div class="wiki-select-container"><div class="wiki-select-body">' +
                            '<div class="wiki-menu-close selector">×</div>' +
                            '<div style="font-size: 1.4em; margin-bottom: 20px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">' +
                                '<span>Wikipedia: ' + movieTitle + '</span>' +
                            '</div>' +
                            '<div class="wiki-items-list" style="max-height: 60vh; overflow-y: auto;"></div></div></div>');

            menu.find('.wiki-menu-close').on('hover:enter click', function() {
                menu.remove();
                isOpened = false;
                Lampa.Controller.toggle(current_controller);
            });

            items.slice(0, 10).forEach(function(item) {
                var el = $('<div class="wiki-item selector">' +
                                '<div class="wiki-item__lang">' + item.lang + '</div>' +
                                '<div class="wiki-item__title">' + item.title + '</div>' +
                            '</div>');
                el.on('hover:enter click', function() {
                    Lampa.Storage.set('wiki_last_lang', item.lang);
                    menu.remove();
                    _this.openIframe(item.url, item.title, current_controller);
                });
                menu.find('.wiki-items-list').append(el);
            });

            $('body').append(menu);

            Lampa.Controller.add('wiki_menu', {
                toggle: function() {
                    Lampa.Controller.collectionSet(menu);
                    var results = menu.find('.wiki-item');
                    if (results.length) {
                        Lampa.Controller.collectionFocus(results[0], menu);
                    } else {
                        Lampa.Controller.collectionFocus(menu.find('.selector')[0], menu);
                    }
                },
                up: function() {
                    var items = menu.find('.selector');
                    var index = items.index(menu.find('.selector.focus'));
                    if (index > 0) {
                        Lampa.Controller.collectionFocus(items[index - 1], menu);
                        _this.scrollMenu(menu, 'up');
                    }
                },
                down: function() {
                    var items = menu.find('.selector');
                    var index = items.index(menu.find('.selector.focus'));
                    if (index < items.length - 1) {
                        Lampa.Controller.collectionFocus(items[index + 1], menu);
                        _this.scrollMenu(menu, 'down');
                    }
                },
                back: function() {
                    menu.remove();
                    isOpened = false;
                    Lampa.Controller.toggle(current_controller);
                }
            });
            Lampa.Controller.toggle('wiki_menu');
        };

        this.scrollMenu = function(menu, dir) {
            var list = menu.find('.wiki-items-list');
            var focus = list.find('.wiki-item.focus');
            if (focus.length) {
                var top = focus.position().top;
                var height = list.height();
                // Если элемент выше видимой области или ниже её
                if (top < 0 || top > height - 50) {
                    var currentScroll = list.scrollTop();
                    list.scrollTop(currentScroll + top - 50);
                }
            }
        };

        this.openIframe = function (url, title, prev_controller) {
            var _this = this;
            // Используем мобильную версию с чистым скином Minerva
            var cleanUrl = url;
            if (cleanUrl.indexOf('?') === -1) cleanUrl += '?useskin=minerva';
            else cleanUrl += '&useskin=minerva';

            if (cleanUrl.indexOf('.m.wikipedia.org') === -1) {
                cleanUrl = cleanUrl.replace('wikipedia.org', 'm.wikipedia.org');
            }
            
            var viewer = $('<div class="wiki-viewer-container">' +
                                '<div class="wiki-content-scroll" style="width: 100%; height: 100%; overflow-y: scroll; background: #fff; -webkit-overflow-scrolling: touch;">' +
                                    '<div class="wiki-iframe-wrapper" style="width: 100%; height: 20000px; position: relative;">' +
                                        '<iframe id="wiki-iframe" src="' + cleanUrl + '" style="width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0;"></iframe>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="wiki-close-btn selector">×</div>' +
                                '<div class="wiki-scroll-indicator" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 10px; pointer-events: none; opacity: 0.7; z-index: 2006;">Используйте стрелки для прокрутки</div>' +
                            '</div>');

            viewer.find('.wiki-close-btn').on('hover:enter click', function() {
                viewer.remove();
                isOpened = false;
                Lampa.Controller.toggle(prev_controller);
            });

            $('body').append(viewer);

            Lampa.Controller.add('wiki_viewer', {
                toggle: function() {
                    Lampa.Controller.collectionSet(viewer);
                    Lampa.Controller.collectionFocus(viewer.find('.wiki-close-btn')[0], viewer);
                },
                up: function() {
                    var scroll = viewer.find('.wiki-content-scroll');
                    scroll.scrollTop(scroll.scrollTop() - 300);
                },
                down: function() {
                    var scroll = viewer.find('.wiki-content-scroll');
                    scroll.scrollTop(scroll.scrollTop() + 300);
                },
                left: function() {
                    var scroll = viewer.find('.wiki-content-scroll');
                    scroll.scrollTop(scroll.scrollTop() - 800);
                },
                right: function() {
                    var scroll = viewer.find('.wiki-content-scroll');
                    scroll.scrollTop(scroll.scrollTop() + 800);
                },
                back: function() {
                    viewer.remove();
                    isOpened = false;
                    Lampa.Controller.toggle(prev_controller);
                }
            });

            Lampa.Controller.toggle('wiki_viewer');
        };
    }

    if (window.Lampa) new WikiSmartPlugin().init();
})();
