import json
import re
from datetime import datetime
from html.parser import HTMLParser
from urllib.request import urlopen

WEIGHT_CLASSES = (
    'Heavyweight',
    'Light Heavyweight',
    'Middleweight',
    'Welterweight',
    'Lightweight',
    'Featherweight',
    'Bantamweight',
    'Flyweight',
)

class EventDetailsPageParser(HTMLParser):
    def __init__(self):
        super().__init__()

        self._inside_event_row = False
        self._inside_fighter_name_node = False
        self._winners = []
        self._losers = []
        self._methods = []
        self._weight_classes = []
        self._date = None

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            for name, value in attrs:
                if name == 'data-link' and '/fight-details/' in value:
                    self._inside_event_row = True
                    break
        elif tag == 'a' and self._inside_event_row:
            for name, value in attrs:
                if name == 'href' and '/fighter-details/' in value:
                    self._inside_fighter_name_node = True
                    break

    def handle_data(self, data):
        striped_data = data.strip()

        if self._inside_fighter_name_node:
            if len(self._winners) == len(self._losers):
                self._winners.append(striped_data)
            else:
                self._losers.append(striped_data)
        elif self._inside_event_row:
            if striped_data == 'SUB':
                self._methods.append('SUBMISSION')
            elif striped_data == 'KO/TKO':
                self._methods.append('KNOKOUT')
            elif striped_data in ('U-DEC', 'S-DEC'):
                self._methods.append('DECISION')
            elif striped_data in WEIGHT_CLASSES:
                self._weight_classes.append(striped_data.upper())
        elif re.search(r'\w+ \d{2}\, \d{4}', striped_data):
            dt = datetime.strptime(striped_data, '%B %d, %Y')
            self._date = dt.strftime('%Y-%m-%d')

    def handle_endtag(self, tag):
        if tag == 'tr' and self._inside_event_row:
            self._inside_event_row = False
            if len(self._methods) < len(self._winners):
                self._winners.pop()
                self._losers.pop()
                if len(self._weight_classes) < len(self._winners):
                    self._weight_classes.pop()
            elif len(self._weight_classes) < len(self._winners):
                self._weight_classes.append('UNKNOWN')
        elif tag == 'a' and self._inside_fighter_name_node:
            self._inside_fighter_name_node = False

    def build_fight_history(self):
        history = []

        for i in range(len(self._winners)):
            history.append({
                'winner': self._winners[i],
                'loser': self._losers[i],
                'method': self._methods[i],
                'weight_class': self._weight_classes[i],
                'date': self._date,
            })

        return history

def main():
    all_events_url = 'http://ufcstats.com/statistics/events/completed?page=all'

    with urlopen(all_events_url) as res:
        html = res.read()

    html = html.decode('utf8')

    event_details_url_regex = r'http://ufcstats.com/event-details/[a-z\d]+'

    url_matches = re.finditer(event_details_url_regex, html)

    next(url_matches)

    fight_history = []

    for m in url_matches:
        event_details_url = m.group(0)

        with urlopen(event_details_url) as res:
            html = res.read()

        html = html.decode('utf8')

        parser = EventDetailsPageParser()
        parser.feed(html)
        fight_history.extend(parser.build_fight_history())

    with open('fight_history.json', 'w') as f:
        json.dump(fight_history, f, indent=2)

if __name__ == '__main__':
    main()
