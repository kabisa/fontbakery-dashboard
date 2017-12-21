FROM node:latest

RUN npm install -g bower browserify requirejs;


ADD ./.bowerrc ./bower.json ./package.json /var/javascript/

RUN touch /tmp/cache_spoof_1
ADD ./generated_modules /var/javascript/generated_modules


# will also invoke bower install etc.
# --production: don't install dev-dependencies
RUN cd /var/javascript && npm install --unsafe-perm  --production


RUN cd /var/javascript \
     && bower install --allow-root \
     && browserify ./browser/js/bower_components/jiff/jiff.js -s jiff \
                         -o ./browser/js/bower_components/jiff/jiff.umd.js && browserify \
                   ./browser/js/bower_components/jiff/lib/jsonPointer -s jsonPointer \
                         -o ./browser/js/bower_components/jiff/jsonPointer.umd.js \
     && cp -r ./generated_modules/protocolbuffers ./node_modules/protocolbuffers \
     && mkdir -p ./browser/js/bower_components/protocolbuffers \
     && browserify ./node_modules/protocolbuffers/shared_pb.js -s  protocolbuffers/shared_pb \
                         -o ./browser/js/bower_components/protocolbuffers/shared_pb.js;

# TODO: install with bower when:
# https://github.com/drudru/ansi_up/issues/39 is resolved
RUN mkdir -p /var/javascript/browser/js/bower_components/ansi_up/ \
    && curl -o /var/javascript/browser/js/bower_components/ansi_up/ansi_up.js \
               https://raw.githubusercontent.com/drudru/ansi_up/master/ansi_up.js

ADD ./fontsgit /var/fontsgit
# This way we only need to rebuild the last intermediate container when
# code changed, especially the npm install can be skipped!
ADD ./browser /var/javascript/browser
ADD ./node /var/javascript/node